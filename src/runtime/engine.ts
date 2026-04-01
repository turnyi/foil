import PromptHandler from './ai/prompt/promptHandler'
import mergeHandlers from './ai/prompt/mergeHandlers'
import { FileTracker } from './engine/consumers/fileTracker'
import { Logger } from '../helpers/logger'
import type ISessionEngine from './engine/session/isession.engine'
import type { Session } from '../db/schema'
import type { StreamHandlers } from './ai/types/streamTypes'
import type { AskResult } from './engine/types'

export class Engine {
  constructor(
    private handler: PromptHandler,
    private sessionEngine: ISessionEngine,
    private log: Logger,
  ) {}

  async getSessions(): Promise<Session[]> {
    return this.sessionEngine.getSessions()
  }
  async getMessages(sessionId: string) {
    this.sessionEngine.getMessages(sessionId)
  }

  async ask(message: string, sessionId: string, ...handlers: StreamHandlers[]): Promise<AskResult> {
    const messages = await this.sessionEngine.buildContext(
      { role: 'user', content: message },
      sessionId,
    )
    this.log.debug('Asking', { messageCount: messages.length })

    const result = await this.handler.ask(
      messages,
      mergeHandlers(new FileTracker(this.sessionEngine, this.log).getHandlers(), ...handlers),
    )
    this.log.debug('Response received', { totalTokens: result.totalTokens })

    await Promise.all([this.sessionEngine.appendResponse(result.messages, sessionId)])

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
