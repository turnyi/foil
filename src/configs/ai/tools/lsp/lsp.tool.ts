import { z } from "zod"
import BaseTool from "../BaseTool"
import { lspManager } from "../../../../configs/lsp/lspManager"
import DESCRIPTION from "./lsp.tool.txt"

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

type MethodEntry = (uri: string, position: object, query?: string) => { method: string; params: object }

const methodMap: Record<string, MethodEntry> = {
  goToDefinition:     (uri, position) => ({ method: "textDocument/definition",     params: { textDocument: { uri }, position } }),
  findReferences:     (uri, position) => ({ method: "textDocument/references",      params: { textDocument: { uri }, position, context: { includeDeclaration: true } } }),
  hover:              (uri, position) => ({ method: "textDocument/hover",           params: { textDocument: { uri }, position } }),
  documentSymbol:     (uri)           => ({ method: "textDocument/documentSymbol",  params: { textDocument: { uri } } }),
  workspaceSymbol:    (_u, _p, q)     => ({ method: "workspace/symbol",             params: { query: q ?? "" } }),
  goToImplementation: (uri, position) => ({ method: "textDocument/implementation", params: { textDocument: { uri }, position } }),
}

class LspTool extends BaseTool<typeof parameters> {
  readonly name = "lsp"
  readonly description = DESCRIPTION
  readonly parameters = parameters

  protected override async run({ operation, file, line = 1, character = 1, query }: z.infer<typeof parameters>) {
    if (operation === "diagnostics") {
      const diags = lspManager.getDiagnostics(file)
      const formatted = lspManager.formatDiagnostics(file, diags)
      return { diagnostics: formatted || "no diagnostics" }
    }

    const entry = methodMap[operation]
    if (!entry) return { error: `Unknown operation: ${operation}` }

    const uri = `file://${file}`
    const position = { line: line - 1, character: character - 1 }
    const { method, params } = entry(uri, position, query)

    try {
      const result = await lspManager.request(file, method, params)
      return { result }
    } catch (e: any) {
      return { error: e.message ?? String(e) }
    }
  }
}

export default new LspTool()
