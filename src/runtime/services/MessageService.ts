import { createLogger } from "../../helpers/logger";
import { randomUUID } from "crypto";
import type { MessageRepository } from "../../db/repositories/MessageRepository";
import type { Message } from "../../db/schema";
import type { ModelMessage } from "ai";
import type { ILogger } from "../../helpers/logger";

export interface CreateMessageInput {
  sessionId: string;
  role: "user" | "assistant" | "tool" | "system";
  content: unknown;
  tokens?: number;
}

export class MessageService {
  private readonly log: ILogger

  constructor(private readonly repository: MessageRepository, logger?: ILogger) {
    this.log = logger?.child('MessageService') ?? createLogger('MessageService')
  }

  async create(input: CreateMessageInput): Promise<Message> {
    this.log.debug('Persisting message', { sessionId: input.sessionId, role: input.role })
    return this.repository.create({
      id: randomUUID(),
      sessionId: input.sessionId,
      role: input.role,
      content: input.content,
      tokens: input.tokens ?? null,
      createdAt: new Date(),
    });
  }

  async getById(id: string): Promise<ModelMessage | null> {
    const msg = await this.repository.getById(id);
    if (!msg) return null;
    return this.convertToModelMessage(msg);
  }

  async getBySession(sessionId: string): Promise<ModelMessage[]> {
    const messages = await this.repository.getBySession(sessionId);
    this.log.debug('Loaded messages for session', { sessionId, count: messages.length })
    return messages.map(this.convertToModelMessage);
  }

  async delete(id: string): Promise<void> {
    this.log.debug('Deleting message', { id })
    return this.repository.delete(id);
  }

  async deleteBySession(sessionId: string): Promise<void> {
    this.log.info('Deleting all messages for session', { sessionId })
    return this.repository.deleteBySession(sessionId);
  }

  private convertToModelMessage(msg: Message): ModelMessage {
    if (msg.role === "tool") {
      return {
        role: "tool",
        content: msg.content as never,
      };
    }
    if (msg.role === "assistant") {
      return { role: "assistant", content: msg.content as never };
    }
    return { role: "user", content: msg.content as never };
  }
}

