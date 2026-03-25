import { existsSync } from "fs"
import { resolve } from "path"

export interface LSPServer {
  name: string
  languageId: string
  extensions: string[]
  command: string
  args: string[]
  rootMarkers: string[]
  initialization?: Record<string, unknown> | ((root: string) => Record<string, unknown>)
}

export const lspRegistry: LSPServer[] = [
  {
    name: "typescript",
    languageId: "typescript",
    extensions: [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".mts", ".cts"],
    command: "bun",
    args: ["x", "typescript-language-server", "--stdio"],
    rootMarkers: ["package.json", "bun.lock", "bun.lockb", "pnpm-lock.yaml", "yarn.lock"],
    initialization: (root: string) => {
      const candidates = [
        resolve(root, "node_modules/typescript/lib/tsserver.js"),
        new URL("../../node_modules/typescript/lib/tsserver.js", import.meta.url).pathname,
      ]
      const tsserver = candidates.find(existsSync)
      return tsserver ? { tsserver: { path: tsserver } } : {}
    },
  },
]

export function getServerForFile(file: string): LSPServer | null {
  const lastDot = file.lastIndexOf(".")
  if (lastDot === -1) return null
  const ext = file.slice(lastDot)
  return lspRegistry.find(s => s.extensions.includes(ext)) ?? null
}
