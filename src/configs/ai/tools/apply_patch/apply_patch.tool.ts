import { z } from "zod"
import { mkdir } from "fs/promises"
import { dirname } from "path"
import type ITool from "../ITool"

const description = await Bun.file(new URL("./apply_patch.tool.txt", import.meta.url)).text()

const parameters = z.object({
  patchText: z.string().describe("The full patch text starting with *** Begin Patch and ending with *** End Patch"),
})

type FileOp =
  | { op: "add"; path: string; lines: string[] }
  | { op: "delete"; path: string }
  | { op: "update"; path: string; moveTo?: string; hunks: { context: string; remove: string[]; add: string[] }[] }

function parsePatch(patchText: string): FileOp[] {
  const lines = patchText.split("\n")
  const ops: FileOp[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]!

    if (line.startsWith("*** Add File: ")) {
      const path = line.slice("*** Add File: ".length).trim()
      const addLines: string[] = []
      i++
      while (i < lines.length && !lines[i]!.startsWith("*** ")) {
        if (lines[i]!.startsWith("+")) addLines.push(lines[i]!.slice(1))
        i++
      }
      ops.push({ op: "add", path, lines: addLines })
      continue
    }

    if (line.startsWith("*** Delete File: ")) {
      ops.push({ op: "delete", path: line.slice("*** Delete File: ".length).trim() })
      i++
      continue
    }

    if (line.startsWith("*** Update File: ")) {
      const path = line.slice("*** Update File: ".length).trim()
      let moveTo: string | undefined
      i++

      if (lines[i]?.startsWith("*** Move to: ")) {
        moveTo = lines[i]!.slice("*** Move to: ".length).trim()
        i++
      }

      const hunks: { context: string; remove: string[]; add: string[] }[] = []

      while (i < lines.length && !lines[i]!.startsWith("*** ")) {
        if (lines[i]!.startsWith("@@")) {
          const context = lines[i]!.slice(2).trim()
          i++
          const remove: string[] = []
          const add: string[] = []
          while (i < lines.length && !lines[i]!.startsWith("@@") && !lines[i]!.startsWith("*** ")) {
            if (lines[i]!.startsWith("-")) remove.push(lines[i]!.slice(1))
            else if (lines[i]!.startsWith("+")) add.push(lines[i]!.slice(1))
            i++
          }
          hunks.push({ context, remove, add })
        } else {
          i++
        }
      }

      ops.push({ op: "update", path, moveTo, hunks })
      continue
    }

    i++
  }

  return ops
}

const applyPatchTool: ITool<typeof parameters> = {
  name: "apply_patch",
  description,
  parameters,
  execute: async ({ patchText }) => {
    const start = patchText.indexOf("*** Begin Patch")
    const end = patchText.indexOf("*** End Patch")
    if (start === -1 || end === -1) throw new Error("Invalid patch: missing *** Begin Patch / *** End Patch markers")

    const ops = parsePatch(patchText.slice(start + "*** Begin Patch".length, end))
    const results: string[] = []

    for (const op of ops) {
      if (op.op === "add") {
        await mkdir(dirname(op.path), { recursive: true })
        await Bun.write(op.path, op.lines.join("\n"))
        results.push(`Added: ${op.path}`)
      }

      if (op.op === "delete") {
        const file = Bun.file(op.path)
        if (await file.exists()) {
          await Bun.$`rm ${op.path}`.quiet()
          results.push(`Deleted: ${op.path}`)
        }
      }

      if (op.op === "update") {
        const file = Bun.file(op.path)
        if (!await file.exists()) throw new Error(`File not found: ${op.path}`)
        let content = await file.text()

        for (const hunk of op.hunks) {
          const contextIdx = hunk.context ? content.indexOf(hunk.context) : 0
          if (contextIdx === -1) throw new Error(`Context not found in ${op.path}: ${hunk.context}`)

          const removeStr = hunk.remove.join("\n")
          const addStr = hunk.add.join("\n")

          if (removeStr) {
            if (!content.includes(removeStr)) throw new Error(`Cannot find lines to remove in ${op.path}`)
            content = content.replace(removeStr, addStr)
          } else {
            const insertAt = contextIdx + hunk.context.length
            content = content.slice(0, insertAt) + "\n" + addStr + content.slice(insertAt)
          }
        }

        const targetPath = op.moveTo ?? op.path
        if (op.moveTo) await mkdir(dirname(op.moveTo), { recursive: true })
        await Bun.write(targetPath, content)
        if (op.moveTo && op.path !== op.moveTo) await Bun.$`rm ${op.path}`.quiet()
        results.push(op.moveTo ? `Updated and moved: ${op.path} → ${op.moveTo}` : `Updated: ${op.path}`)
      }
    }

    return { results }
  },
}

export default applyPatchTool
