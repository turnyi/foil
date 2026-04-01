import { injectable, inject } from 'tsyringe'
import { randomUUID } from 'crypto'
import { MessageRepository } from '../../db/repositories/MessageRepository'
import { TOKEN } from '../../di/tokens'
import { type Message, type NewMessage } from '../../db/schema'
import type { ModelMessage } from 'ai'
import type { ILogger } from '../../helpers/logger'

@injectable()
export class MessageService {
  private readonly log: ILogger

  constructor(
    @inject(MessageRepository) private readonly repository: MessageRepository,
    @inject(TOKEN.Logger) logger: ILogger,
  ) {
    this.log = logger.child('MessageService')
  }

  async create(input: NewMessage): Promise<Message> {
    this.log.debug('Persisting message', { sessionId: input.sessionId, role: input.role })
    return this.repository.create({
      id: randomUUID(),
      reasoning: input.reasoning,
      sessionId: input.sessionId,
      role: input.role,
      content: input.content,
      tokens: input.tokens ?? null,
      createdAt: new Date(),
    })
  }

  async updateLatest(input: Partial<Message>): Promise<Message> {
    this.log.debug('Persisting message', { sessionId: input.sessionId, role: input.role })
    const messageToUpdate = await this.repository.getLatestByRoleAndSession(
      input.sessionId,
      input.role,
    )
    if (!messageToUpdate) throw Error('no message to update')
    await this.repository.update(messageToUpdate.id, input)
    return messageToUpdate
  }

  async getById(id: string): Promise<ModelMessage | null> {
    const msg = await this.repository.getById(id)
    if (!msg) return null
    return this.convertToModelMessage(msg)
  }

  async getBySession(sessionId: string): Promise<ModelMessage[]> {
    const messages = await this.repository.getBySession(sessionId)
    this.log.debug('Loaded messages for session', { sessionId, count: messages.length })
    return messages.map(this.convertToModelMessage)
  }

  async delete(id: string): Promise<void> {
    this.log.debug('Deleting message', { id })
    return this.repository.delete(id)
  }

  async deleteBySession(sessionId: string): Promise<void> {
    this.log.info('Deleting all messages for session', { sessionId })
    return this.repository.deleteBySession(sessionId)
  }

  private convertToModelMessage(msg: Message): ModelMessage {
    if (msg.role === 'tool') {
      return {
        role: 'tool',
        content: msg.content as never,
      }
    }
    if (msg.role === 'assistant') {
      return { role: 'assistant', content: msg.content as never }
    }
    return { role: 'user', content: msg.content as never }
  }
}
