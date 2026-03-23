import { Output, streamText } from "ai"
import type { LanguageModel, ModelMessage, StreamTextResult, ToolSet } from "ai"

type TextOutput = ReturnType<typeof Output.text>

class PromptMessageHandler {
  private stream: StreamTextResult<ToolSet, TextOutput> | null = null
  private contextWindow: number
  private messages: ModelMessage[] = []
  private model: LanguageModel
  private tools: ToolSet

  constructor(model: LanguageModel, contextWindow: number, tools: ToolSet) {
    this.model = model
    this.contextWindow = contextWindow
    this.tools = tools
  }

  public send(content: string) {
    this.messages.push({ role: 'user', content })
    this.stream = streamText({
      model: this.model,
      system: `You are a coding assistant. You have filesystem and git tools available. Always use your tools to answer — never guess or fabricate results. The working directory is ${process.cwd()}. Before any git operation, always call git_set_working_dir with path "${process.cwd()}" first.`,
      messages: this.messages,
      tools: this.tools,
      toolChoice: 'auto',
      stopWhen: () => false,
    })
  }

  public get textStream() {
    if (!this.stream) throw new Error('No active stream. Call send() first.')
    return this.stream.textStream
  }

  public async getResponse() {
    if (!this.stream) throw new Error('No active stream. Call send() first.')

    const [text, usage, response] = await Promise.all([this.stream.text, this.stream.totalUsage, this.stream.response])
    const consumedTokens = usage.totalTokens ?? (usage.inputTokens ?? 0) + (usage.outputTokens ?? 0)
    const contextUsagePercent = Math.round((consumedTokens / this.contextWindow) * 10000) / 100

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
