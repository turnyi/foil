import ModelConfig from './ai/modelConfig'
import ToolsConfig from './ai/tools/toolsConfig'
import PromptMessageHandler from './prompt/promptMessageHandler'
import { lspManager } from './lsp/lspManager'
import type { StreamHandlers } from './prompt/streamTypes'

export interface TokenUsage {
  totalTokens: number
  contextUsagePercent?: number | string
}

export interface EngineStartResult {
  success: boolean
  message?: string
  issue?: string
}

export class Engine {
  private handler!: PromptMessageHandler
  readonly ready: Promise<EngineStartResult>

  constructor() {
    process.on('exit', () => lspManager.shutdown())
    process.on('SIGINT', () => {
      lspManager.shutdown()
      process.exit(0)
    })
    this.ready = this.initialize()
  }

  async initialize(): Promise<EngineStartResult> {
    try {
      const modelConfig = new ModelConfig()
      await modelConfig.loadContextWindow()
      const toolsConfig = new ToolsConfig(modelConfig.model)
      this.handler = new PromptMessageHandler(
        modelConfig.model,
        modelConfig.contextWindow,
        toolsConfig.tools
      )
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

  send(message: string): void {
    this.handler.send(message)
  }

  async consume(handlers: StreamHandlers = {}): Promise<void> {
    await this.handler.consume(handlers)
  }

  async getUsage(): Promise<TokenUsage> {
    const { totalTokens, contextUsagePercent } = await this.handler.getResponse()
    return { totalTokens, contextUsagePercent }
  }

  async getModel() {
    await this.ready
    return this.handler.model
  }
}

export default Engine
