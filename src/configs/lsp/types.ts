import type { createMessageConnection } from "vscode-jsonrpc/node"
import type { Diagnostic } from "vscode-languageserver-types"

export interface DiagnosticsEvent {
  path: string
  serverID: string
}

export interface LSPConnection {
  connection: ReturnType<typeof createMessageConnection>
  diagnostics: Map<string, Diagnostic[]>
  notify: {
    open(input: { path: string }): Promise<void>
  }
  waitForDiagnostics(input: { path: string }): Promise<void>
  shutdown(): void
}
