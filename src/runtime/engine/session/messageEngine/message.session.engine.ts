import { createLogger } from '../../../helpers/logger'
import type { ModelMessage } from 'ai'
import type { Session } from '../../../db/schema'
import type { MessageService, SessionService } from '../../services'
import type ISessionEngine from './isession.engine'
import type { ILogger } from '../../../helpers/logger'
import type PromptHandler from '../../ai/prompt/promptHandler'
import CREATE_TITLE from './createTitle.txt'
import type { StreamHandlers } from '../../ai/types/streamTypes'

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
  async getSession(id: string): Promise<Session> {
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

  public getStreamHandlers(sessionId: string): StreamHandlers {
    return {
      onStart: async () => {
        const msg = await this.messageService.create({
          sessionId,
          role: 'assistant',
          content: '',
          status: 'active',
        })
        messageId = msg.id
      },
      onFinish: async (finishReason: string, totalUsage: unknown) => {
        await this.messageService.updateLatest({ status: 'finished' })
        this.log.debug('Stream finished', { sessionId, finishReason, totalUsage })
      },
      onAbort: async (reason?: string) => {
        await this.messageService.updateLatest({ status: 'aborted' })
        this.log.warn('Stream aborted', { sessionId, reason })
      },
      onError: async (error: unknown) => {
        await this.messageService.updateLatest({ status: 'error' })
        this.log.error('Stream error', { sessionId, error })
      },
      onTextStart: async () => {
        textBuffer = ''
      },
      onText: async (text: string) => {
        textBuffer += text
        await this.messageService.updateLatest({ content: textBuffer })
      },
      onTextEnd: async () => {
        await this.messageService.updateLatest({ content: textBuffer })
      },

      onReasoningStart: async () => {
        reasoningBuffer = ''
      },
      onReasoning: async (text: string) => {
        reasoningBuffer += text
        await this.messageService.updateLatest({ reasoning: reasoningBuffer })
      },
      onReasoningEnd: async () => {
        await this.messageService.updateLatest({ reasoning: reasoningBuffer })
      },

      onToolCall: async (toolName: string, args: unknown) => {
        await this.messageService.create({
          sessionId,
          role: 'tool',
          content: { toolName, args },
          status: 'finished',
        })
      },
      onToolResult: async (toolName: string, result: unknown) => {
        await this.messageService.create({
          sessionId,
          role: 'tool',
          content: { toolName, result },
          status: 'finished',
        })
      },
      onToolError: async (toolName: string, error: unknown) => {
        await this.messageService.create({
          sessionId,
          role: 'tool',
          content: { toolName, error },
          status: 'error',
        })
      },
    }
  }
}
