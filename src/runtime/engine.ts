import { injectable, inject } from 'tsyringe'
import PromptHandler from './ai/prompt/promptHandler'
import MessageSession from './engine/session/messageEngine/message.session.engine'
import { TOKEN } from '../di/tokens'
import type { StreamHandlers } from './ai/types/streamTypes'
import type { AskResult } from './engine/types'
import type { ILogger } from '../helpers/logger'
import type ISessionEngine from './engine/session/isession.engine'

@injectable()
export class Engine {
  private readonly log: ILogger

  constructor(
    @inject(PromptHandler) private handler: PromptHandler,
    @inject(MessageSession) private sessionEngine: ISessionEngine,
    @inject(TOKEN.Logger) logger: ILogger,
  ) {
    this.log = logger.child('Engine')
  }

  async ask(message: string, sessionId: string, handlers: StreamHandlers[]): Promise<AskResult> {
    const messages = await this.sessionEngine.buildContext(
      { role: 'user', content: message },
      sessionId,
    )
    this.log.debug('Asking', { messageCount: messages.length })

    const sessionHandlers = this.sessionEngine.getStreamHandlers(sessionId)
    const result = await this.handler.ask(messages, [sessionHandlers, ...handlers])
    this.log.debug('Response received', { totalTokens: result.totalTokens })

    await this.sessionEngine.appendResponse(result.messages, sessionId)

    return result
  }

  getContextWindow(): number | undefined {
    return this.handler?.contextWindow
  }

  getModelId(): string {
    const model = this.handler.model
    if (typeof model === 'string') return model
    return (model as { modelId?: string }).modelId ?? 'unknown'
  }
}

export default Engine
