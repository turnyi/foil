import { createMessageConnection, StreamMessageReader, StreamMessageWriter } from "vscode-jsonrpc/node"
import { spawn } from "child_process"
import { pathToFileURL, fileURLToPath } from "url"
import { existsSync } from "fs"
import { resolve } from "path"
import { EventEmitter } from "events"
import { createLogger } from "../../helpers/logger"
import { getServerForFile } from "./lspRegistry"
import type { LSPServer } from "./lspRegistry"
import type { Diagnostic } from "vscode-languageserver-types"
import type { DiagnosticsEvent, LSPConnection } from "./types"
import type { ILogger } from "../../helpers/logger"
import { findRoot } from "../../helpers/fileSystem"
import { withTimeout } from "../../helpers/timeout"


const DIAGNOSTICS_DEBOUNCE_MS = 150
const DIAGNOSTICS_TIMEOUT_MS = 3_000
const INITIALIZE_TIMEOUT_MS = 45_000


class LSPManager {
  private clients = new Map<string, Promise<LSPConnection>>()
  private resolvedClients = new Map<string, LSPConnection>()
  private broken = new Set<string>()
  private emitter = new EventEmitter()
  private log: ILogger = createLogger('LSPManager')

  setLogger(logger: ILogger): void {
    this.log = logger.child('LSPManager')
  }

  private clientKey(serverName: string, root: string) {
    return `${serverName}@${root}`
  }

  private async spawnClient(config: LSPServer, root: string): Promise<LSPConnection> {
    const key = this.clientKey(config.name, root)
    const emitter = this.emitter

    const localBin = resolve(root, "node_modules/.bin", config.command)
    const resolvedCommand = existsSync(localBin) ? localBin : config.command

    this.log.debug(`Spawning ${config.name}`, { command: resolvedCommand, args: config.args, root })

    const proc = spawn(resolvedCommand, config.args, {
      cwd: root,
      stdio: ["pipe", "pipe", "pipe"],
    })

    proc.stderr?.on("data", (chunk: Buffer) => {
      this.log.warn(`[${config.name}] ${chunk.toString().trimEnd()}`)
    })

    await new Promise<void>((resolve, reject) => {
      proc.once("spawn", () => {
        this.log.info(`Spawned ${config.name}`, { pid: proc.pid, root })
        resolve()
      })
      proc.once("error", (err) => {
        this.broken.add(key)
        this.log.error(`Failed to spawn ${config.name}`, { command: resolvedCommand, error: err.message })
        reject(new Error(`Failed to spawn ${resolvedCommand}: ${err.message}`))
      })
    })

    const initialization = typeof config.initialization === "function"
      ? config.initialization(root)
      : config.initialization ?? {}

    const connection = createMessageConnection(
      new StreamMessageReader(proc.stdout as any),
      new StreamMessageWriter(proc.stdin as any),
    )

    const diagnostics = new Map<string, Diagnostic[]>()

    connection.onNotification("textDocument/publishDiagnostics", (params: any) => {
      const filePath = fileURLToPath(params.uri)
      diagnostics.set(filePath, params.diagnostics ?? [])
      const event: DiagnosticsEvent = { path: filePath, serverID: config.name }
      emitter.emit("diagnostics", event)
    })

    connection.onRequest("window/workDoneProgress/create", () => null)
    connection.onRequest("workspace/configuration", () => [initialization])
    connection.onRequest("client/registerCapability", () => { })
    connection.onRequest("client/unregisterCapability", () => { })
    connection.onRequest("workspace/workspaceFolders", () => [
      { name: "workspace", uri: pathToFileURL(root).href },
    ])

    connection.listen()

    this.log.debug(`Initializing ${config.name}`)
    try {
      await withTimeout(
        connection.sendRequest("initialize", {
          rootUri: pathToFileURL(root).href,
          processId: proc.pid,
          workspaceFolders: [{ name: "workspace", uri: pathToFileURL(root).href }],
          initializationOptions: initialization,
          capabilities: {
            window: { workDoneProgress: true },
            workspace: {
              configuration: true,
              didChangeWatchedFiles: { dynamicRegistration: true },
            },
            textDocument: {
              synchronization: { didOpen: true, didChange: true },
              publishDiagnostics: { versionSupport: true },
            },
          },
        }),
        INITIALIZE_TIMEOUT_MS,
      )
    } catch (e) {
      this.broken.add(key)
      proc.kill()
      connection.dispose()
      this.log.error(`Initialize failed for ${config.name}`, { error: String(e) })
      throw new Error(`LSP initialize failed for ${config.command}: ${e}`)
    }

    this.log.info(`${config.name} ready`, { root })
    await connection.sendNotification("initialized", {})

    if (config.initialization) {
      await connection.sendNotification("workspace/didChangeConfiguration", {
        settings: config.initialization,
      })
    }

    const files: Record<string, number> = {}

    proc.on("exit", (code) => {
      this.log.warn(`${config.name} exited`, { key, code })
      this.clients.delete(key)
      this.resolvedClients.delete(key)
    })

    const client: LSPConnection = {
      connection,
      diagnostics,
      notify: {
        async open({ path: filePath }) {
          if (!existsSync(filePath)) return
          const text = await Bun.file(filePath).text()
          const uri = pathToFileURL(filePath).href
          const version = files[filePath]

          if (version !== undefined) {
            await connection.sendNotification("workspace/didChangeWatchedFiles", {
              changes: [{ uri, type: 2 }],
            })
            const next = version + 1
            files[filePath] = next
            await connection.sendNotification("textDocument/didChange", {
              textDocument: { uri, version: next },
              contentChanges: [{ text }],
            })
          } else {
            await connection.sendNotification("workspace/didChangeWatchedFiles", {
              changes: [{ uri, type: 1 }],
            })
            diagnostics.delete(filePath)
            await connection.sendNotification("textDocument/didOpen", {
              textDocument: { uri, languageId: config.languageId, version: 0, text },
            })
            files[filePath] = 0
          }
        },
      },
      async waitForDiagnostics({ path: filePath }) {
        let unsub: (() => void) | undefined
        let debounceTimer: ReturnType<typeof setTimeout> | undefined
        await withTimeout(
          new Promise<void>((resolve) => {
            const handler = (event: DiagnosticsEvent) => {
              if (event.path === filePath && event.serverID === config.name) {
                if (debounceTimer) clearTimeout(debounceTimer)
                debounceTimer = setTimeout(() => {
                  unsub?.()
                  resolve()
                }, DIAGNOSTICS_DEBOUNCE_MS)
              }
            }
            emitter.on("diagnostics", handler)
            unsub = () => emitter.off("diagnostics", handler)
          }),
          DIAGNOSTICS_TIMEOUT_MS,
        )
          .catch(() => { })
          .finally(() => {
            if (debounceTimer) clearTimeout(debounceTimer)
            unsub?.()
          })
      },
      shutdown() {
        connection.end()
        connection.dispose()
        proc.kill()
      },
    }

    return client
  }

  private async getClient(config: LSPServer, file: string): Promise<LSPConnection | null> {
    const root = await findRoot(file, config.rootMarkers)
    const key = this.clientKey(config.name, root)

    if (this.broken.has(key)) return null

    if (!this.clients.has(key)) {
      const promise = this.spawnClient(config, root)
        .then((client) => {
          this.resolvedClients.set(key, client)
          return client
        })
        .catch((e) => {
          this.clients.delete(key)
          throw e
        })
      this.clients.set(key, promise)
    }

    try {
      return await this.clients.get(key)!
    } catch (e) {
      this.log.error(`Failed to start ${config.name}`, { error: e instanceof Error ? e.message : String(e) })
      return null
    }
  }

  /** Call after writing a file — notifies LSP, waits for diagnostics, returns them. */
  async touchFile(filePath: string): Promise<Diagnostic[]> {
    const config = getServerForFile(filePath)
    if (!config) return []

    const client = await this.getClient(config, filePath)
    if (!client) return []

    this.log.debug('Touching file', { filePath, server: config.name })
    await client.notify.open({ path: filePath })
    await client.waitForDiagnostics({ path: filePath })
    const diags = client.diagnostics.get(filePath) ?? []
    if (diags.length > 0)
      this.log.warn('Diagnostics found', { filePath, count: diags.length })
    else
      this.log.debug('No diagnostics', { filePath })
    return diags
  }

  /** Get last known diagnostics synchronously (no server roundtrip). */
  getDiagnostics(filePath: string): Diagnostic[] {
    for (const client of this.resolvedClients.values()) {
      const diags = client.diagnostics.get(filePath)
      if (diags) return diags
    }
    return []
  }

  /** Send any LSP request for a file (definition, references, hover, etc.) */
  async request(filePath: string, method: string, params: object): Promise<unknown> {
    const config = getServerForFile(filePath)
    if (!config) throw new Error(`No LSP server configured for: ${filePath}`)
    const client = await this.getClient(config, filePath)
    if (!client) throw new Error(`LSP server unavailable for: ${filePath}`)
    return client.connection.sendRequest(method, params)
  }

  /** Format diagnostics as compact agent-readable strings. */
  formatDiagnostics(filePath: string, diagnostics: Diagnostic[]): string {
    if (diagnostics.length === 0) return ""
    const label = (s?: number) => ["", "error", "warning", "info", "hint"][s ?? 1] ?? "error"
    return diagnostics
      .map(d => `${filePath}:${d.range.start.line + 1}:${d.range.start.character + 1} [${label(d.severity)}] ${d.message}`)
      .join("\n")
  }

  shutdown(): void {
    this.log.info('Shutting down', { clients: this.resolvedClients.size })
    for (const client of this.resolvedClients.values()) {
      client.shutdown()
    }
    this.clients.clear()
    this.resolvedClients.clear()
  }
}

export const lspManager = new LSPManager()

process.on('exit', () => lspManager.shutdown())
process.on('SIGINT', () => {
  lspManager.shutdown()
  process.exit(0)
})
