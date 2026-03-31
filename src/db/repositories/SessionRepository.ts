import { eq, desc } from "drizzle-orm";
import { db } from "../index";
import { sessions, type Session, type NewSession } from "../schema";

export class SessionRepository {
  async create(session: NewSession): Promise<Session> {
    const created = await db.insert(sessions).values(session).returning();
    return created[0]!;
  }

  async getById(id: string): Promise<Session | null> {
    const result = await db
      .select()
      .from(sessions)
      .where(eq(sessions.id, id))
      .limit(1);
    return result[0] ?? null;
  }

  async getAll(): Promise<Session[]> {
    return db.select().from(sessions).orderBy(desc(sessions.updatedAt));
  }

  async update(
    id: string,
    data: Partial<Pick<Session, "name" | "modelId" | "summary" | "metadata" | "totalTokens">>,
  ): Promise<Session | null> {
    const updated = await db
      .update(sessions)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(sessions.id, id))
      .returning();
    return updated[0] ?? null;
  }

  async delete(id: string): Promise<void> {
    await db.delete(sessions).where(eq(sessions.id, id));
  }
}
