import type { SessionRepository } from "../db/repositories/SessionRepository";
import type { Session } from "../db/schema";
import { randomUUID } from "crypto";

export interface CreateSessionInput {
  name: string;
  modelId: string;
}

export class SessionService {
  constructor(private readonly repository: SessionRepository) {}

  async create(input: CreateSessionInput): Promise<Session> {
    const now = new Date();
    return this.repository.create({
      id: randomUUID(),
      name: input.name,
      modelId: input.modelId,
      createdAt: now,
      updatedAt: now,
    });
  }

  async getById(id: string): Promise<Session | null> {
    return this.repository.getById(id);
  }

  async getAll(): Promise<Session[]> {
    return this.repository.getAll();
  }

  async update(
    id: string,
    data: Partial<Pick<Session, "name" | "modelId" | "summary" | "metadata">>,
  ): Promise<Session | null> {
    return this.repository.update(id, data);
  }

  async updateSummary(id: string, summary: string): Promise<void> {
    await this.repository.update(id, { summary })
  }

  async delete(id: string): Promise<void> {
    return this.repository.delete(id);
  }
}
