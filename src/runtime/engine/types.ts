import type { LanguageModel, ModelMessage, ToolSet } from "ai"
import type ISessionEngine from "./session/isession.engine"

export interface EngineConfig {
  model?: LanguageModel
  tools?: ToolSet
  system?: string
  session?: ISessionEngine
}

export interface TokenUsage {
  totalTokens: number
  contextUsagePercent?: number | string
}

export interface AskResult extends TokenUsage {
  messages: ModelMessage[]
}

export interface EngineStartResult {
  success: boolean
  message?: string
  issue?: string
}
