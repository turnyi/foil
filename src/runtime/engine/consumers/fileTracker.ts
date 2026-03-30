import type IConsumer from "./IConsumer"
import type ISessionEngine from "../session/isession.engine"
import type { StreamHandlers } from "../../ai/types/streamTypes"



export class FileTracker implements IConsumer {
  private filesRead = new Set<string>()
  private filesModified = new Set<string>()

  private READ_TOOLS = new Set(['read', 'glob', 'grep', 'ls', 'codesearch'])
  private WRITE_TOOLS = new Set(['write', 'edit', 'multiedit', 'apply_patch'])

  constructor(private readonly session: ISessionEngine) { }

  getHandlers(): StreamHandlers {
    return {
      onToolCall: (toolName, args) => {
        const path = this.extractPath(toolName, args)
        if (!path) return
        if (this.READ_TOOLS.has(toolName)) this.filesRead.add(path)
        if (this.WRITE_TOOLS.has(toolName)) this.filesModified.add(path)
      },
      onFinish: () => {
        if (this.filesRead.size === 0 && this.filesModified.size === 0) return
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
