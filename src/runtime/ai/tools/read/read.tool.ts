import { z } from "zod"
import BaseTool from "../BaseTool"
import DESCRIPTION from "./read.tool.txt"

const MAX_LINES = 2000
const MAX_BYTES = 50_000

const parameters = z.object({
  path: z.string().describe("Absolute or relative path to the file"),
  offset: z.number().optional().describe("Line number to start reading from (1-indexed)"),
  limit: z.number().optional().describe(`Max number of lines to read, defaults to ${MAX_LINES}`),
})

class ReadTool extends BaseTool<typeof parameters> {
  readonly name = "read"
  readonly description = DESCRIPTION
  readonly parameters = parameters

  protected override async run({ path, offset = 1, limit = MAX_LINES }: z.infer<typeof parameters>) {
    const file = Bun.file(path)
    if (!await file.exists()) return { error: `File not found: ${path}` }

    const text = await file.text()
    const lines = text.split("\n")
    const start = Math.max(0, offset - 1)
    const end = Math.min(lines.length, start + limit)
    const slice = lines.slice(start, end)

    const bytes = slice.join("\n").length
    const truncated = bytes > MAX_BYTES

    const content = slice
      .slice(0, truncated ? Math.floor(MAX_BYTES / 80) : slice.length)
      .map((line, i) => `${start + i + 1}: ${line}`)
      .join("\n")

    return { content, totalLines: lines.length, truncated }
  }
}

export default new ReadTool()
