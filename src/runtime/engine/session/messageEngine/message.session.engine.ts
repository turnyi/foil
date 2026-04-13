import { injectable, inject } from 'tsyringe'
import type { ModelMessage } from 'ai'
import type { Session } from '../../../../db/schema'
import type ISessionEngine from '../isession.engine'
import type { ILogger } from '../../../../helpers/logger'
import PromptHandler from '../../../ai/prompt/promptHandler'
import { SessionService } from '../../../services/SessionService'
import { MessageService } from '../../../services/MessageService'
import { TOKEN } from '../../../../di/tokens'
import CREATE_TITLE from './createTitle.txt'
import type { StreamHandlers } from '../../../ai/types/streamTypes'

@injectable()
export default class MessageSession implements ISessionEngine {
  private readonly log: ILogger

  constructor(
    @inject(SessionService) private sessionService: SessionService,
    @inject(MessageService) private messageService: MessageService,
    @inject(PromptHandler) private promptHandler: PromptHandler,
    @inject(TOKEN.Logger) logger: ILogger,
  ) {
    this.log = logger.child('MessageSession')
  }

  async buildContext(promptMessage: ModelMessage, sessionId: string): Promise<ModelMessage[]> {
    const session = await this.sessionService.getById(sessionId)
    if (!session) {
      this.log.error('Session not found', { sessionId })
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
    type ToolCallPart = { type: 'tool-call'; toolCallId: string; toolName: string; args: unknown }
    let stepText = ''
    let stepReasoning = ''
    let stepToolCalls: ToolCallPart[] = []

    return {
      onStepStart: async () => {
        stepText = ''
        stepReasoning = ''
        stepToolCalls = []
        await this.messageService.create({
          sessionId,
          role: 'assistant',
          content: '',
          status: 'active',
        })
      },
      onText: async (delta: string) => {
        stepText += delta
        await this.messageService.updateLatest({ sessionId, role: 'assistant', content: stepText })
      },
      onReasoning: async (delta: string) => {
        stepReasoning += delta
        await this.messageService.updateLatest({
          sessionId,
          role: 'assistant',
          reasoning: stepReasoning,
        })
      },
      onToolCall: async (toolCallId: string, toolName: string, args: unknown) => {
        stepToolCalls.push({ type: 'tool-call', toolCallId, toolName, args })
      },
      onStepFinish: async () => {
        const content =
          stepToolCalls.length > 0
            ? [...(stepText ? [{ type: 'text' as const, text: stepText }] : []), ...stepToolCalls]
            : stepText
        await this.messageService.updateLatest({
          sessionId,
          role: 'assistant',
          content,
          status: 'finished',
        })
      },
      onToolResult: async (toolCallId: string, toolName: string, result: unknown) => {
        await this.messageService.create({
          sessionId,
          role: 'tool',
          content: [{ type: 'tool-result', toolCallId, toolName, result }],
          status: 'finished',
        })
      },
      onToolError: async (toolCallId: string, toolName: string, error: unknown) => {
        await this.messageService.create({
          sessionId,
          role: 'tool',
          content: [{ type: 'tool-result', toolCallId, toolName, result: error, isError: true }],
          status: 'error',
        })
      },
      onFinish: async (finishReason: string, totalUsage: unknown) => {
        const usage = totalUsage as { outputTokens?: number } | null
        await this.messageService.updateLatest({
          sessionId,
          role: 'assistant',
          status: 'finished',
          tokens: usage?.outputTokens ?? null,
        })
        this.log.debug('Stream finished', { sessionId, finishReason, totalUsage })
      },
      onAbort: async (reason?: string) => {
        await this.messageService.updateLatest({ sessionId, role: 'assistant', status: 'aborted' })
        this.log.warn('Stream aborted', { sessionId, reason })
      },
      onError: async (error: unknown) => {
        await this.messageService.updateLatest({ sessionId, role: 'assistant', status: 'error' })
        this.log.error('Stream error', { sessionId, error })
      },
    }
  }
}
