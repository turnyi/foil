import { Logger, ConsoleTransport } from "../../helpers/logger";
import { randomUUID } from "crypto";
import type { SessionRepository } from "../db/repositories/SessionRepository";
import type { Session } from "../db/schema";
import type { ILogger } from "../../helpers/logger";

export interface CreateSessionInput {
  name: string;
  modelId: string;
}

export class SessionService {
  private readonly log: ILogger

  constructor(private readonly repository: SessionRepository, logger?: ILogger) {
    this.log = logger?.child('SessionService') ?? new Logger('SessionService', [new ConsoleTransport()])
  }

  async create(input: CreateSessionInput): Promise<Session> {
    this.log.info('Creating session', { name: input.name, modelId: input.modelId })
    const now = new Date();
    const session = await this.repository.create({
      id: randomUUID(),
      name: input.name,
      modelId: input.modelId,
      createdAt: now,
      updatedAt: now,
    });
    this.log.debug('Session persisted', { id: session.id })
    return session
  }

  async getById(id: string): Promise<Session | null> {
    return this.repository.getById(id);
  }

  async getAll(): Promise<Session[]> {
    return this.repository.getAll();
  }

  async update(
    id: string,
    data: Partial<Pick<Session, "name" | "modelId" | "summary" | "metadata" | "totalTokens">>,
  ): Promise<Session | null> {
    this.log.debug('Updating session', { id, fields: Object.keys(data) })
    return this.repository.update(id, data);
  }

  async updateSummary(id: string, summary: string): Promise<void> {
    await this.repository.update(id, { summary })
  }

  async accumulateTokens(id: string, tokens: number): Promise<void> {
    const session = await this.repository.getById(id)
    if (!session) return
    const totalTokens = (session.totalTokens ?? 0) + tokens
    this.log.debug('Accumulating tokens', { id, added: tokens, total: totalTokens })
    await this.repository.update(id, { totalTokens })
  }

  async delete(id: string): Promise<void> {
    this.log.info('Deleting session', { id })
    return this.repository.delete(id);
  }
}
