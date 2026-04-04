import { injectable, inject } from 'tsyringe'
import PromptHandler from './ai/prompt/promptHandler'
import MessageSession from './engine/session/messageEngine/message.session.engine'
import { TOKEN } from '../di/tokens'
import type { Session } from '../db/schema'
import type { StreamHandlers } from './ai/types/streamTypes'
import type { AskResult } from './engine/types'
import type { ILogger } from '../helpers/logger'

@injectable()
export class Engine {
  private readonly log: ILogger

  constructor(
    @inject(PromptHandler) private handler: PromptHandler,
    @inject(MessageSession) private sessionEngine: MessageSession,
    @inject(TOKEN.Logger) logger: ILogger,
  ) {
    this.log = logger.child('Engine')
  }

  async getSessions(): Promise<Session[]> {
    return this.sessionEngine.getSessions()
  }

  async getMessages(sessionId: string) {
    this.sessionEngine.getMessages(sessionId)
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

  getSession(sessionId: string) {
    return this.sessionEngine.getSession(sessionId)
  }

  getContextWindow(): number | undefined {
    return this.handler?.contextWindow
  }

  async getModel() {
    return this.handler.model
  }
}

export default Engine
