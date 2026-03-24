import { z } from "zod"
import { spawn } from "child_process"
import type ITool from "../ITool"

const description = await Bun.file(new URL("./lsp.tool.txt", import.meta.url)).text()

const parameters = z.object({
  operation: z.enum([
    "goToDefinition",
    "findReferences",
    "hover",
    "documentSymbol",
    "workspaceSymbol",
    "goToImplementation",
    "diagnostics",
  ]).describe("The LSP operation to perform"),
  file: z.string().describe("Absolute path to the file"),
  line: z.number().optional().describe("1-indexed line number"),
  character: z.number().optional().describe("1-indexed character offset"),
  query: z.string().optional().describe("Symbol name for workspaceSymbol"),
})

function detectServer(file: string): { command: string; args: string[] } | null {
  if (file.endsWith(".ts") || file.endsWith(".tsx") || file.endsWith(".js") || file.endsWith(".jsx")) {
    return { command: "typescript-language-server", args: ["--stdio"] }
  }
  if (file.endsWith(".py")) {
    return { command: "pylsp", args: [] }
  }
  if (file.endsWith(".go")) {
    return { command: "gopls", args: [] }
  }
  if (file.endsWith(".rs")) {
    return { command: "rust-analyzer", args: [] }
  }
  return null
}

let msgId = 0
function nextId() { return ++msgId }

function encode(msg: object): Buffer {
  const body = JSON.stringify(msg)
  return Buffer.from(`Content-Length: ${Buffer.byteLength(body)}\r\n\r\n${body}`)
}

async function lspRequest(
  serverCmd: { command: string; args: string[] },
  cwd: string,
  method: string,
  params: object,
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const proc = spawn(serverCmd.command, serverCmd.args, {
      cwd,
      stdio: ["pipe", "pipe", "ignore"],
    })

    let buffer = ""
    let initialized = false
    const pending = new Map<number, (result: unknown) => void>()

    const send = (msg: object) => proc.stdin.write(encode(msg))

    proc.stdout.on("data", (chunk: Buffer) => {
      buffer += chunk.toString()
      while (true) {
        const headerEnd = buffer.indexOf("\r\n\r\n")
        if (headerEnd === -1) break
        const header = buffer.slice(0, headerEnd)
        const lengthMatch = header.match(/Content-Length: (\d+)/)
        if (!lengthMatch) break
        const length = parseInt(lengthMatch[1]!)
        const bodyStart = headerEnd + 4
        if (buffer.length < bodyStart + length) break
        const body = buffer.slice(bodyStart, bodyStart + length)
        buffer = buffer.slice(bodyStart + length)
        try {
          const msg = JSON.parse(body) as any
          if (msg.id && pending.has(msg.id)) {
            pending.get(msg.id)!(msg.result ?? msg.error)
            pending.delete(msg.id)
          }
          if (!initialized && msg.id === 1) {
            initialized = true
            send({ jsonrpc: "2.0", method: "initialized", params: {} })
            const id = nextId()
            pending.set(id, (result) => {
              proc.kill()
              resolve(result)
            })
            send({ jsonrpc: "2.0", id, method, params })
          }
        } catch {}
      }
    })

    proc.on("error", reject)
    proc.on("exit", (code) => {
      if (code !== 0 && pending.size > 0) reject(new Error(`LSP server exited with code ${code}`))
    })

    const initId = nextId()
    send({
      jsonrpc: "2.0",
      id: initId,
      method: "initialize",
      params: {
        processId: process.pid,
        rootUri: `file://${cwd}`,
        capabilities: { textDocument: { definition: {}, references: {}, hover: {}, documentSymbol: {}, implementation: {} }, workspace: { symbol: {} } },
      },
    })
    pending.set(initId, () => {})

    setTimeout(() => {
      proc.kill()
      reject(new Error("LSP request timed out"))
    }, 10_000)
  })
}

const lspTool: ITool<typeof parameters> = {
  name: "lsp",
  description,
  parameters,
  execute: async ({ operation, file, line = 1, character = 1, query }) => {
    const server = detectServer(file)
    if (!server) return { error: `No LSP server found for file type: ${file}` }

    const uri = `file://${file}`
    const position = { line: line - 1, character: character - 1 }

    const methodMap: Record<string, { method: string; params: object }> = {
      goToDefinition: { method: "textDocument/definition", params: { textDocument: { uri }, position } },
      findReferences: { method: "textDocument/references", params: { textDocument: { uri }, position, context: { includeDeclaration: true } } },
      hover: { method: "textDocument/hover", params: { textDocument: { uri }, position } },
      documentSymbol: { method: "textDocument/documentSymbol", params: { textDocument: { uri } } },
      workspaceSymbol: { method: "workspace/symbol", params: { query: query ?? "" } },
      goToImplementation: { method: "textDocument/implementation", params: { textDocument: { uri }, position } },
      diagnostics: { method: "textDocument/diagnostic", params: { textDocument: { uri } } },
    }

    const { method, params } = methodMap[operation]!
    const result = await lspRequest(server, process.cwd(), method, params)
    return { result }
  },
}

export default lspTool
