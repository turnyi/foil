import { z } from "zod"
import { mkdir } from "fs/promises"
import { dirname } from "path"
import type ITool from "../ITool"

const description = await Bun.file(new URL("./write.tool.txt", import.meta.url)).text()

const parameters = z.object({
  path: z.string().describe("Absolute or relative path to write the file to"),
  content: z.string().describe("The content to write"),
})

const writeTool: ITool<typeof parameters> = {
  name: "write",
  description,
  parameters,
  execute: async ({ path, content }) => {
    await mkdir(dirname(path), { recursive: true })
    await Bun.write(path, content)
    return { success: true, path }
  },
}

export default writeTool
