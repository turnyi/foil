import { z } from "zod"
import type ITool from "../ITool"

const IGNORE = new Set(["node_modules", ".git", "dist", "build", ".next", "out", ".cache", "coverage"])
const MAX_FILES = 100

const description = await Bun.file(new URL("./ls.tool.txt", import.meta.url)).text()

const parameters = z.object({
  path: z.string().optional().describe("Directory to list, defaults to current working directory"),
})

async function buildTree(dir: string, prefix = "", count = { n: 0 }): Promise<string> {
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
    const name = entries[i]
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
      lines.push(await buildTree(fullPath, prefix + childPrefix, count))
    }
  }

  return lines.filter(Boolean).join("\n")
}

const lsTool: ITool<typeof parameters> = {
  name: "ls",
  description,
  parameters,
  execute: async ({ path = process.cwd() }) => {
    const tree = await buildTree(path)
    return { tree: `${path}\n${tree}` }
  },
}

export default lsTool
