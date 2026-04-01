import { createLogger } from '../../../helpers/logger'
import type { ModelMessage } from 'ai'
import type { Session } from '../../../db/schema'
import type { MessageService, SessionService } from '../../services'
import type ISessionEngine from './isession.engine'
import type { ILogger } from '../../../helpers/logger'
import type PromptHandler from '../../ai/prompt/promptHandler'
import CREATE_TITLE from './createTitle.txt'

export default class MessageSession implements ISessionEngine {
  private sessionService: SessionService
  private messageService: MessageService
  private promptHandler: PromptHandler
  private readonly log: ILogger

  constructor(
    sessionService: SessionService,
    messageService: MessageService,
    promptHandler: PromptHandler,
    logger?: ILogger,
  ) {
    this.sessionService = sessionService
    this.messageService = messageService
    this.promptHandler = promptHandler
    this.log = logger?.child('MessageSession') ?? createLogger('MessageSession')
  }
  getSession(id: string): Promise<Session> {
    return await this.sessionService.getById(id)
  }

  async getMessages(sessionId: string): Promise<ModelMessage[]> {
    return this.messageService.getBySession(sessionId)
  }

  async buildContext(promptMessage: ModelMessage, sessionId: string): Promise<ModelMessage[]> {
    const session = await this.sessionService.getById(sessionId)
    if (!session) {
      this.log.error('Session not found', {
        sessionId: session.id,
      })
      throw new Error('session not found')
    }

    this.log.debug('Persisting user message', {
      sessionId: session.id,
      role: promptMessage.role,
    })

    await this.messageService.create({
      sessionId: session.id,
      role: promptMessage.role,
      content: promptMessage.content,
    })

    return this.messageService.getBySession(sessionId)
  }

  async appendResponse(messages: ModelMessage[], sessionId: string): Promise<void> {
    this.log.debug('Persisting response', {
      sessionId: sessionId,
      count: messages.length,
    })
    for (const msg of messages) {
      await this.messageService.create({
        sessionId,
        role: msg.role,
        content: msg.content,
      })
    }
  }

  async getSessions(): Promise<Session[]> {
    return this.sessionService.getAll()
  }

  async createSession(promptMessage: ModelMessage): Promise<Session> {
    this.log.info('Creating session', promptMessage)
    const { text } = await this.promptHandler.ask([
      promptMessage,
      { role: 'system', content: CREATE_TITLE },
    ])

    const session = await this.sessionService.create({ name: text })
    this.log.debug('Session created', { id: session.id })
    return session
  }
}
