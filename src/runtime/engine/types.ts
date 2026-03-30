import type { LanguageModel, ModelMessage, ToolSet } from "ai"

export interface SessionMetadata {
  filesRead?: string[]
  filesModified?: string[]
  tags?: string[]
}
import type ISessionEngine from "./session/isession.engine"
import type { MessageService } from "../services/MessageService"

export interface EngineConfig {
  model?: LanguageModel
  tools?: ToolSet
  system?: string
  session?: ISessionEngine
  messageService?: MessageService
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
