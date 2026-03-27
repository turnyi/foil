import type { ModelMessage } from "ai"

export interface PromptResponse {
  text: string
  messages: ModelMessage[]
  inputTokens?: number
  outputTokens?: number
  totalTokens: number
  contextUsagePercent: number | string
}
