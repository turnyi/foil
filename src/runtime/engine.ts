import ModelConfig from './ai/modelConfig'
import ToolsConfig from './ai/tools/toolsConfig'
import PromptMessageHandler from './prompt/promptMessageHandler'
import { lspManager } from './lsp/lspManager'
import type { StreamHandlers } from './prompt/streamTypes'

export interface SessionConfig {
  onText?: (text: string) => void
  onToolCall?: (toolName: string, args: unknown) => void
  onToolResult?: (toolName: string, result: unknown) => void
  onToolError?: (toolName: string, error: unknown) => void
  onError?: (error: unknown) => void
  onUnhandled?: (part: unknown) => void
}

export interface TokenUsage {
  totalTokens: number
  contextUsagePercent: number
}

export class Engine {
  private handler!: PromptMessageHandler

  constructor() {
    process.on('exit', () => lspManager.shutdown())
    process.on('SIGINT', () => {
      lspManager.shutdown()
      process.exit(0)
    })
  }

  async initialize(): Promise<void> {
    const modelConfig = new ModelConfig()
    await modelConfig.loadContextWindow()
    const toolsConfig = new ToolsConfig(modelConfig.model)
    this.handler = new PromptMessageHandler(
      modelConfig.model,
      modelConfig.contextWindow,
      toolsConfig.tools
    )
  }

  send(message: string): void {
    this.handler.send(message)
  }

  async consume(config: SessionConfig = {}): Promise<void> {
    const handlers: StreamHandlers = {
      onText: config.onText,
      onToolCall: config.onToolCall,
      onToolResult: config.onToolResult,
      onToolError: config.onToolError,
      onError: config.onError,
      onUnhandled: config.onUnhandled,
    }
    await this.handler.consume(handlers)
  }

  async getUsage(): Promise<TokenUsage> {
    const { totalTokens, contextUsagePercent } = await this.handler.getResponse()
    return { totalTokens, contextUsagePercent }
  }
}

export default Engine
