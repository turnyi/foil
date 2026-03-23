import { z } from "zod"
import { stat } from "fs/promises"
import type ITool from "../ITool"

const description = await Bun.file(new URL("./glob.tool.txt", import.meta.url)).text()

const parameters = z.object({
  pattern: z.string().describe('Glob pattern to match files, e.g. "**/*.ts" or "src/**/*.tsx"'),
  cwd: z.string().optional().describe("Directory to search in, defaults to current"),
})

const globTool: ITool<typeof parameters> = {
  name: "glob",
  description,
  parameters,
  execute: async ({ pattern, cwd = process.cwd() }) => {
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
  },
}

export default globTool
