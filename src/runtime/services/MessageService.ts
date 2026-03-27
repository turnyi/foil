import type { MessageRepository } from "../../db/repositories/MessageRepository";
import type { Message } from "../../db/schema";
import type { ModelMessage } from "ai";
import { randomUUID } from "crypto";

export interface CreateMessageInput {
  sessionId: string;
  role: "user" | "assistant" | "tool" | "system";
  content: string;
  tokens?: number;
}

export class MessageService {
  constructor(private readonly repository: MessageRepository) { }

  async create(input: CreateMessageInput): Promise<Message> {
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
    return messages.map(this.convertToModelMessage);
  }

  async delete(id: string): Promise<void> {
    return this.repository.delete(id);
  }

  async deleteBySession(sessionId: string): Promise<void> {
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

