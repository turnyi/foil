import { Logger, ConsoleTransport } from "../../../helpers/logger"
import type IConsumer from "./IConsumer"
import type ISessionEngine from "../session/isession.engine"
import type { StreamHandlers } from "../../ai/types/streamTypes"
import type { ILogger } from "../../../helpers/logger"

export class FileTracker implements IConsumer {
  private filesRead = new Set<string>()
  private filesModified = new Set<string>()
  private readonly log: ILogger

  private READ_TOOLS = new Set(['read', 'glob', 'grep', 'ls', 'codesearch'])
  private WRITE_TOOLS = new Set(['write', 'edit', 'multiedit', 'apply_patch'])

  constructor(private readonly session: ISessionEngine, logger?: ILogger) {
    this.log = logger?.child('FileTracker') ?? new Logger('FileTracker', [new ConsoleTransport()])
  }

  getHandlers(): StreamHandlers {
    return {
      onToolCall: (toolName, args) => {
        const path = this.extractPath(toolName, args)
        if (!path) return
        if (this.READ_TOOLS.has(toolName)) {
          this.log.debug('File read', { tool: toolName, path })
          this.filesRead.add(path)
        }
        if (this.WRITE_TOOLS.has(toolName)) {
          this.log.debug('File modified', { tool: toolName, path })
          this.filesModified.add(path)
        }
      },
      onFinish: () => {
        if (this.filesRead.size === 0 && this.filesModified.size === 0) return
        this.log.info('Flushing file activity', {
          filesRead: this.filesRead.size,
          filesModified: this.filesModified.size,
        })
        this.session.updateMetadata({
          filesRead: [...this.filesRead],
          filesModified: [...this.filesModified],
        }).catch(() => { })
      },
    }
  }

  extractPath(_toolName: string, args: any): string | null {
    return args?.file_path ?? args?.path ?? null
  }
}
