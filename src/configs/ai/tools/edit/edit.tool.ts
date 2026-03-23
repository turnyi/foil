import { z } from "zod"
import type ITool from "../ITool"

const description = await Bun.file(new URL("./edit.tool.txt", import.meta.url)).text()

const parameters = z.object({
  path: z.string().describe("Path to the file to edit"),
  oldString: z.string().describe("The exact string to replace"),
  newString: z.string().describe("The string to replace it with"),
  replaceAll: z.boolean().optional().describe("Replace all occurrences, defaults to false"),
})

export async function applyEdit(
  content: string,
  oldString: string,
  newString: string,
  replaceAll = false,
): Promise<string> {
  if (replaceAll) return content.replaceAll(oldString, newString)

  const count = content.split(oldString).length - 1
  if (count === 0) throw new Error(`String not found in file: ${JSON.stringify(oldString)}`)
  if (count > 1) throw new Error(`String found ${count} times — provide more context to make it unique`)

  return content.replace(oldString, newString)
}

const editTool: ITool<typeof parameters> = {
  name: "edit",
  description,
  parameters,
  execute: async ({ path, oldString, newString, replaceAll = false }) => {
    const file = Bun.file(path)
    if (!await file.exists()) return { error: `File not found: ${path}` }

    const content = await file.text()
    const updated = await applyEdit(content, oldString, newString, replaceAll)
    await Bun.write(path, updated)

    return { success: true, path }
  },
}

export default editTool
