import ModelConfig from './ai/modelConfig'
import ToolsConfig from './ai/tools/toolsConfig'
import PromptHandler from './ai/prompt/promptHandler'
import MemorySession from './engine/session/memory.session'
import mergeHandlers from './ai/prompt/mergeHandlers'
import type ISessionEngine from './engine/session/isession.engine'
import type { Session } from '../db/schema'
import type { StreamHandlers } from './ai/types/streamTypes'
import type { EngineConfig, AskResult, EngineStartResult } from './engine/types'
import SYSTEM from './ai/prompt/system.txt'

export class Engine {
  private handler!: PromptHandler
  private session!: ISessionEngine
  readonly ready: Promise<EngineStartResult>

  constructor(private readonly config: EngineConfig = {}) {
    this.ready = this.initialize()
  }

  async initialize(): Promise<EngineStartResult> {
    try {
      const modelConfig = new ModelConfig()
      await modelConfig.loadContextWindow()

      const model = this.config.model ?? modelConfig.model
      const tools = this.config.tools ?? new ToolsConfig(model).tools
      const system = this.config.system ?? SYSTEM.replace('{cwd}', process.cwd())

      this.handler = new PromptHandler(model, modelConfig.contextWindow, tools, system)
      this.session = this.config.session ?? new MemorySession()

      return { success: true }
    }
    catch (e) {
      const err = e as Error
      return {
        success: false,
        message: 'Engine failed to initialize',
        issue: err?.message ?? String(e),
      }
    }
  }

  async getSessions(): Promise<Session[]> {
    return this.session.getSessions()
  }

  async loadSession(session: Session): Promise<ModelMessage[]> {
    const messages = this.config.messageService
      ? await this.config.messageService.getBySession(session.id)
      : []
    await this.session.loadSession(session, messages)
    return messages
  }

  async createSession(name: string): Promise<Session> {
    await this.ready
    const modelId = (this.handler.model as any).modelId ?? 'unknown'
    return this.session.createSession(name, modelId)
  }

  async ask(message: string, ...handlers: StreamHandlers[]): Promise<AskResult> {
    if (!this.session.hasActiveSession())
      await this.createSession(new Date().toLocaleString())

    const messages = await this.session.buildContext({ role: 'user', content: message })
    const result = await this.handler.ask(messages, mergeHandlers(...handlers))
    await this.session.appendResponse(result.messages)
    return result
  }

  async getModel() {
    await this.ready
    return this.handler.model
  }
}

export default Engine
