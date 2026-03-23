import { z } from "zod"
import type ITool from "../ITool"
import { applyEdit } from "../edit/edit.tool"

const description = await Bun.file(new URL("./multiedit.tool.txt", import.meta.url)).text()

const parameters = z.object({
  path: z.string().describe("Path to the file to edit"),
  edits: z.array(z.object({
    oldString: z.string().describe("The exact string to replace"),
    newString: z.string().describe("The string to replace it with"),
    replaceAll: z.boolean().optional().describe("Replace all occurrences, defaults to false"),
  })).describe("List of edits to apply sequentially"),
})

const multieditTool: ITool<typeof parameters> = {
  name: "multiedit",
  description,
  parameters,
  execute: async ({ path, edits }) => {
    const file = Bun.file(path)
    if (!await file.exists()) return { error: `File not found: ${path}` }

    let content = await file.text()

    for (const edit of edits) {
      content = await applyEdit(content, edit.oldString, edit.newString, edit.replaceAll ?? false)
    }

    await Bun.write(path, content)
    return { success: true, path, editsApplied: edits.length }
  },
}

export default multieditTool
