import { Output, streamText } from "ai"
import type { LanguageModel, ModelMessage, StreamTextResult, ToolSet } from "ai"
import { StreamPartType, type StreamHandlers } from "./streamTypes"

type TextOutput = ReturnType<typeof Output.text>

class PromptMessageHandler {
  private stream: StreamTextResult<ToolSet, TextOutput> | null = null
  private contextWindow?: number
  private messages: ModelMessage[] = []
  public model: LanguageModel
  private tools: ToolSet

  constructor(model: LanguageModel, contextWindow: number | undefined, tools: ToolSet) {
    this.model = model
    this.contextWindow = contextWindow
    this.tools = tools
  }

  public send(content: string) {
    this.messages.push({ role: 'user', content })
    this.stream = streamText({
      model: this.model,
      system: `You are a coding assistant with access to filesystem, git, and web tools. Always use your tools — never guess or fabricate results. Working directory: ${process.cwd()}.`,
      messages: this.messages,
      tools: this.tools,
      toolChoice: 'auto',
      stopWhen: () => false,
    })
  }

  public async consume(handlers: StreamHandlers = {}) {
    if (!this.stream) throw new Error('No active stream. Call send() first.')

    for await (const part of this.stream.fullStream) {
      switch (part.type) {
        case StreamPartType.TextDelta:
          handlers.onText?.(part.text)
          break
        case StreamPartType.ReasoningDelta:
          handlers.onReasoning?.(part.text)
          break
        case StreamPartType.ToolCall:
          handlers.onToolCall?.(part.toolName, (part as any).args ?? (part as any).input)
          break
        case StreamPartType.ToolResult:
          handlers.onToolResult?.(part.toolName, (part as any).result ?? (part as any).output)
          break
        case StreamPartType.ToolError:
          handlers.onToolError?.(part.toolName, part.error)
          break
        case StreamPartType.Error:
          handlers.onError?.(part.error)
          break
        case StreamPartType.Abort:
          handlers.onAbort?.((part as any).reason)
          break
        case StreamPartType.StartStep:
          handlers.onStepStart?.()
          break
        case StreamPartType.FinishStep:
          handlers.onStepFinish?.()
          break
        case StreamPartType.Start:
          handlers.onStart?.()
          break
        case StreamPartType.Finish:
          handlers.onFinish?.(part.finishReason, part.totalUsage)
          break
        case StreamPartType.TextStart:
          handlers.onTextStart?.()
          break
        case StreamPartType.TextEnd:
          handlers.onTextEnd?.()
          break
        case StreamPartType.ReasoningStart:
          handlers.onReasoningStart?.()
          break
        case StreamPartType.ReasoningEnd:
          handlers.onReasoningEnd?.()
          break
        case StreamPartType.ToolInputStart:
          handlers.onToolInputStart?.((part as any).toolName)
          break
        //TODO
        case StreamPartType.ToolInputDelta:
          handlers.onToolInputDelta?.((part as any).toolName, (part as any).inputTextDelta)
          break
        case StreamPartType.ToolInputEnd:
          handlers.onToolInputEnd?.((part as any).toolName)
          break
        case StreamPartType.ToolOutputDenied:
          handlers.onToolOutputDenied?.((part as any).toolName)
          break
        case StreamPartType.ToolApprovalRequest:
          handlers.onToolApprovalRequest?.((part as any).toolName)
          break
        case StreamPartType.Source:
          handlers.onSource?.(part)
          break
        case StreamPartType.File:
          handlers.onFile?.(part)
          break
        case StreamPartType.Raw:
          handlers.onRaw?.(part)
          break
      }
    }
  }

  public async getResponse() {
    if (!this.stream) throw new Error('No active stream. Call send() first.')

    const [text, usage, response] = await Promise.all([this.stream.text, this.stream.totalUsage, this.stream.response])
    const consumedTokens = usage.totalTokens ?? (usage.inputTokens ?? 0) + (usage.outputTokens ?? 0)
    const contextUsagePercent = this.contextWindow ? Math.round((consumedTokens / this.contextWindow) * 10000) / 100 : "No context length info"

    this.messages.push(...response.messages)

    return {
      text,
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
      totalTokens: consumedTokens,
      contextUsagePercent,
    }
  }
}

export default PromptMessageHandler
