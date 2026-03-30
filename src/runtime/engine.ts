import { generateText } from 'ai'
import ModelConfig from './ai/modelConfig'
import ToolsConfig from './ai/tools/toolsConfig'
import PromptHandler from './ai/prompt/promptHandler'
import MemorySession from './engine/session/memory.session'
import mergeHandlers from './ai/prompt/mergeHandlers'
import { FileTracker } from './engine/consumers/fileTracker'
import type { ModelMessage } from 'ai'
import type ISessionEngine from './engine/session/isession.engine'
import type { Session } from '../db/schema'
import type { StreamHandlers } from './ai/types/streamTypes'
import type { EngineConfig, AskResult, EngineStartResult } from './engine/types'
import SYSTEM from './ai/prompt/system.txt'

export class Engine {
  private handler!: PromptHandler
  private session!: ISessionEngine
  private needsTitle = false
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
    this.needsTitle = false
    return messages
  }

  async createSession(name: string): Promise<Session> {
    await this.ready
    const modelId = (this.handler.model as any).modelId ?? 'unknown'
    const session = await this.session.createSession(name, modelId)
    this.needsTitle = true
    return session
  }

  async ask(message: string, ...handlers: StreamHandlers[]): Promise<AskResult> {
    if (!this.session.hasActiveSession())
      await this.createSession(new Date().toLocaleString())

    const messages = await this.session.buildContext({ role: 'user', content: message })

    const titlePromise = this.needsTitle
      ? (this.needsTitle = false, this.generateTitle(message).catch(() => { }))
      : Promise.resolve()

    const result = await this.handler.ask(messages, mergeHandlers(new FileTracker(this.session).getHandlers(), ...handlers))
    await Promise.all([this.session.appendResponse(result.messages), titlePromise])

    return result
  }

  private async generateTitle(userMessage: string): Promise<void> {
    const [{ text: name }, { text: summary }] = await Promise.all([
      generateText({
        model: this.handler.model,
        prompt: `Generate a concise 3-5 word title for a conversation starting with this message. Reply with only the title, no punctuation.\n\nMessage: ${userMessage}`,
      }),
      generateText({
        model: this.handler.model,
        prompt: `Write a single sentence (max 100 chars) describing what this message is asking about. Reply with only the sentence.\n\nMessage: ${userMessage}`,
      }),
    ])
    await this.session.updateTitle(name.trim(), summary.trim())
  }

  async getModel() {
    await this.ready
    return this.handler.model
  }
}

export default Engine
