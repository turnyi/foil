export interface LSPServer {
  name: string
  languageId: string
  extensions: string[]
  command: string
  args: string[]
  rootMarkers: string[]
  initialization?: Record<string, unknown>
}

export const lspRegistry: LSPServer[] = [
  {
    name: "typescript",
    languageId: "typescript",
    extensions: [".ts", ".tsx", ".mts", ".cts"],
    command: "typescript-language-server",
    args: ["--stdio"],
    rootMarkers: ["tsconfig.json", "package.json", "bun.lockb", "yarn.lock", "pnpm-lock.yaml"],
  },
  {
    name: "javascript",
    languageId: "javascript",
    extensions: [".js", ".jsx", ".mjs", ".cjs"],
    command: "typescript-language-server",
    args: ["--stdio"],
    rootMarkers: ["package.json", "bun.lockb", "yarn.lock", "pnpm-lock.yaml"],
  },
  {
    name: "python",
    languageId: "python",
    extensions: [".py", ".pyw"],
    command: "pylsp",
    args: [],
    rootMarkers: ["pyproject.toml", "setup.py", "setup.cfg", "requirements.txt"],
  },
  {
    name: "go",
    languageId: "go",
    extensions: [".go"],
    command: "gopls",
    args: [],
    rootMarkers: ["go.mod", "go.sum"],
  },
  {
    name: "rust",
    languageId: "rust",
    extensions: [".rs"],
    command: "rust-analyzer",
    args: [],
    rootMarkers: ["Cargo.toml", "Cargo.lock"],
  },
  {
    name: "lua",
    languageId: "lua",
    extensions: [".lua"],
    command: "lua-language-server",
    args: [],
    rootMarkers: [".luarc.json", "stylua.toml"],
  },
  {
    name: "css",
    languageId: "css",
    extensions: [".css", ".scss", ".less", ".sass"],
    command: "vscode-css-language-server",
    args: ["--stdio"],
    rootMarkers: ["package.json"],
  },
  {
    name: "html",
    languageId: "html",
    extensions: [".html", ".htm"],
    command: "vscode-html-language-server",
    args: ["--stdio"],
    rootMarkers: ["package.json"],
  },
  {
    name: "json",
    languageId: "json",
    extensions: [".json", ".jsonc"],
    command: "vscode-json-language-server",
    args: ["--stdio"],
    rootMarkers: ["package.json"],
  },
]

export function getServerForFile(file: string): LSPServer | null {
  const lastDot = file.lastIndexOf(".")
  if (lastDot === -1) return null
  const ext = file.slice(lastDot)
  return lspRegistry.find(s => s.extensions.includes(ext)) ?? null
}
