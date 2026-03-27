import { streamText } from "ai"
import type { LanguageModel, ModelMessage, ToolSet } from "ai"
import type { StreamHandlers } from "../types/streamTypes"
import type { PromptResponse } from "../types/promptTypes"
import streamPartHandlers from "./streamPartHandlers"

class PromptHandler {
  private contextWindow?: number
  public model: LanguageModel
  private tools: ToolSet
  private system: string

  constructor(model: LanguageModel, contextWindow: number | undefined, tools: ToolSet, system: string) {
    this.model = model
    this.contextWindow = contextWindow
    this.tools = tools
    this.system = system
  }

  public async ask(messages: ModelMessage[], handlers: StreamHandlers = {}): Promise<PromptResponse> {
    const stream = streamText({
      model: this.model,
      system: this.system,
      messages,
      tools: this.tools,
      toolChoice: 'auto',
      stopWhen: () => false,
    })

    for await (const part of stream.fullStream) {
      streamPartHandlers[part.type]?.(part, handlers)
    }

    const [text, usage, response] = await Promise.all([stream.text, stream.totalUsage, stream.response])
    const consumedTokens = usage.totalTokens ?? (usage.inputTokens ?? 0) + (usage.outputTokens ?? 0)
    const contextUsagePercent = this.contextWindow
      ? Math.round((consumedTokens / this.contextWindow) * 10000) / 100
      : "No context length info"

    return {
      text,
      messages: response.messages,
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
      totalTokens: consumedTokens,
      contextUsagePercent,
    }
  }
}

export default PromptHandler
