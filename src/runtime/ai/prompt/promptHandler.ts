import { injectable, inject } from 'tsyringe'
import { streamText } from 'ai'
import { TOKEN } from '../../../di/tokens'
import type { LanguageModel, ModelMessage, ToolSet } from 'ai'
import type { StreamHandlers } from '../types/streamTypes'
import type { PromptResponse } from '../types/promptTypes'
import type { ILogger } from '../../../helpers/logger'
import streamPartHandlers from './streamPartHandlers'

@injectable()
class PromptHandler {
  public contextWindow?: number
  public model: LanguageModel
  private tools: ToolSet
  private system: string
  private readonly log: ILogger

  constructor(
    @inject(TOKEN.LanguageModel) model: LanguageModel,
    @inject(TOKEN.ContextWindow) contextWindow: number | undefined,
    @inject(TOKEN.ToolSet) tools: ToolSet,
    @inject(TOKEN.SystemPrompt) system: string,
    @inject(TOKEN.Logger) logger: ILogger,
  ) {
    this.model = model
    this.contextWindow = contextWindow
    this.tools = tools
    this.system = system
    this.log = logger.child('PromptHandler')
  }

  public async ask(
    messages: ModelMessage[],
    handlers: StreamHandlers[] = [],
  ): Promise<PromptResponse> {
    this.log.debug('Sending request', { messageCount: messages.length })

    const stream = streamText({
      model: this.model,
      system: this.system,
      messages,
      tools: this.tools,
      toolChoice: 'auto',
      stopWhen: () => false,
    })

    for await (const part of stream.fullStream) {
      for (const handler of handlers) {
        streamPartHandlers[part.type]?.(part, handler)
      }
    }

    const [text, usage, response] = await Promise.all([
      stream.text,
      stream.totalUsage,
      stream.response,
    ])
    const consumedTokens = usage.totalTokens ?? (usage.inputTokens ?? 0) + (usage.outputTokens ?? 0)
    const contextUsagePercent = this.contextWindow
      ? Math.round((consumedTokens / this.contextWindow) * 10000) / 100
      : 'No context length info'

    this.log.info('Response complete', { totalTokens: consumedTokens, contextUsagePercent })

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
