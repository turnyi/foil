import { eq, asc } from "drizzle-orm";
import { db } from "../index";
import { messages, type Message, type NewMessage } from "../schema";

export class MessageRepository {
  async create(message: NewMessage): Promise<Message> {
    const created = await db.insert(messages).values(message).returning();
    return created[0]!;
  }

  async getById(id: string): Promise<Message | null> {
    const result = await db
      .select()
      .from(messages)
      .where(eq(messages.id, id))
      .limit(1);
    return result[0] ?? null;
  }

  async getBySession(sessionId: string): Promise<Message[]> {
    return db
      .select()
      .from(messages)
      .where(eq(messages.sessionId, sessionId))
      .orderBy(asc(messages.createdAt));
  }

  async delete(id: string): Promise<void> {
    await db.delete(messages).where(eq(messages.id, id));
  }

  async deleteBySession(sessionId: string): Promise<void> {
    await db.delete(messages).where(eq(messages.sessionId, sessionId));
  }
}
