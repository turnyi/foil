import { z } from "zod"
import { stat } from "fs/promises"
import BaseTool from "../BaseTool"
import DESCRIPTION from "./glob.tool.txt"

const parameters = z.object({
  pattern: z.string().describe('Glob pattern to match files, e.g. "**/*.ts" or "src/**/*.tsx"'),
  cwd: z.string().optional().describe("Directory to search in, defaults to current"),
})

class GlobTool extends BaseTool<typeof parameters> {
  readonly name = "glob"
  readonly description = DESCRIPTION
  readonly parameters = parameters

  protected override async run({ pattern, cwd = process.cwd() }: z.infer<typeof parameters>) {
    const glob = new Bun.Glob(pattern)
    const files: { path: string; mtime: number }[] = []

    for await (const file of glob.scan({ cwd, absolute: true })) {
      const s = await stat(file).catch(() => null)
      files.push({ path: file, mtime: s?.mtimeMs ?? 0 })
    }

    const sorted = files
      .sort((a, b) => b.mtime - a.mtime)
      .slice(0, 100)
      .map(f => f.path)

    return { files: sorted, count: sorted.length }
  }
}

export default new GlobTool()
