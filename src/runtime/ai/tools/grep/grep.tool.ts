import { z } from "zod"
import { stat } from "fs/promises"
import BaseTool from "../BaseTool"
import DESCRIPTION from "./grep.tool.txt"

const parameters = z.object({
  pattern: z.string().describe("Regex pattern to search for"),
  include: z.string().optional().describe('Glob to filter files, e.g. "*.ts" or "src/**/*.tsx"'),
  cwd: z.string().optional().describe("Directory to search in, defaults to current"),
})

class GrepTool extends BaseTool<typeof parameters> {
  readonly name = "grep"
  readonly description = DESCRIPTION
  readonly parameters = parameters

  protected override async run({ pattern, include, cwd = process.cwd() }: z.infer<typeof parameters>) {
    const args = ["-nH", "--hidden", "-e", pattern]
    if (include) args.push("--glob", include)
    args.push(".")

    const result = await Bun.$`rg ${args}`.quiet().nothrow().cwd(cwd)
    const lines = result.stdout.toString().trim().split("\n").filter(Boolean)

    type Match = { file: string; line: number; content: string; mtime: number }
    const matches: Match[] = []

    for (const line of lines) {
      const colon1 = line.indexOf(":")
      const colon2 = line.indexOf(":", colon1 + 1)
      if (colon1 === -1 || colon2 === -1) continue
      const file = line.slice(0, colon1)
      const lineNum = parseInt(line.slice(colon1 + 1, colon2))
      const content = line.slice(colon2 + 1)
      const s = await stat(file).catch(() => null)
      matches.push({ file, line: lineNum, content, mtime: s?.mtimeMs ?? 0 })
    }

    const sorted = matches.sort((a, b) => b.mtime - a.mtime).slice(0, 100)
    return { matches: sorted.map(({ file, line, content }) => ({ file, line, content })), count: sorted.length }
  }
}

export default new GrepTool()
