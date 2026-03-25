import { z } from "zod"
import BaseTool from "../BaseTool"
import DESCRIPTION from "./ls.tool.txt"

const IGNORE = new Set(["node_modules", ".git", "dist", "build", ".next", "out", ".cache", "coverage"])
const MAX_FILES = 100

const parameters = z.object({
  path: z.string().optional().describe("Directory to list, defaults to current working directory"),
})

class LsTool extends BaseTool<typeof parameters> {
  readonly name = "ls"
  readonly description = DESCRIPTION
  readonly parameters = parameters

  private async buildTree(dir: string, prefix = "", count = { n: 0 }): Promise<string> {
    if (count.n >= MAX_FILES) return ""

    const glob = new Bun.Glob("*")
    const entries: string[] = []
    for await (const entry of glob.scan({ cwd: dir, onlyFiles: false })) {
      entries.push(entry)
    }
    entries.sort()

    const lines: string[] = []
    for (let i = 0; i < entries.length; i++) {
      if (count.n >= MAX_FILES) break
      const name = entries[i]!
      if (IGNORE.has(name)) continue

      const isLast = i === entries.length - 1
      const connector = isLast ? "└── " : "├── "
      const childPrefix = isLast ? "    " : "│   "
      const fullPath = `${dir}/${name}`
      const file = Bun.file(fullPath)

      count.n++
      const isDir = !(await file.exists())
      lines.push(prefix + connector + name + (isDir ? "/" : ""))

      if (isDir) {
        lines.push(await this.buildTree(fullPath, prefix + childPrefix, count))
      }
    }

    return lines.filter(Boolean).join("\n")
  }

  protected override async run({ path = process.cwd() }: z.infer<typeof parameters>) {
    const tree = await this.buildTree(path)
    return { tree: `${path}\n${tree}` }
  }
}

export default new LsTool()
