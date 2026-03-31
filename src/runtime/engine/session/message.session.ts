import { Logger, ConsoleTransport } from "../../../helpers/logger";
import type { ModelMessage } from "ai";
import type { Session } from "../../../db/schema";
import type { MessageService, SessionService } from "../../services";
import type ISessionEngine from "./isession.engine";
import type { SessionMetadata } from "../types";
import type { ILogger } from "../../../helpers/logger";

export default class MessageSession implements ISessionEngine {
  private sessionService: SessionService;
  private messageService: MessageService;
  private activeSession?: Session
  private activeSessionMessages?: ModelMessage[]
  private readonly log: ILogger

  constructor(sessionService: SessionService, messageService: MessageService, logger?: ILogger) {
    this.sessionService = sessionService
    this.messageService = messageService
    this.log = logger?.child('MessageSession') ?? new Logger('MessageSession', [new ConsoleTransport()])
  }

  hasActiveSession(): boolean {
    return !!this.activeSession
  }

  getActiveSession(): Session | undefined {
    return this.activeSession
  }

  async buildContext(promptMessage: ModelMessage): Promise<ModelMessage[]> {
    if (!this.activeSession) throw new Error('No active session. Call loadSession() first.')
    if (!this.activeSessionMessages)
      this.activeSessionMessages = []
    this.activeSessionMessages.push(promptMessage)
    this.log.debug('Persisting user message', { sessionId: this.activeSession.id, role: promptMessage.role })
    await this.messageService.create({ sessionId: this.activeSession.id, role: promptMessage.role, content: promptMessage.content })
    return this.activeSessionMessages
  }

  async appendResponse(messages: ModelMessage[]): Promise<void> {
    if (!this.activeSession) throw new Error('No active session. Call loadSession() first.')
    if (!this.activeSessionMessages)
      this.activeSessionMessages = []
    this.log.debug('Persisting response', { sessionId: this.activeSession.id, count: messages.length })
    for (const msg of messages) {
      this.activeSessionMessages.push(msg)
      await this.messageService.create({ sessionId: this.activeSession.id, role: msg.role, content: msg.content })
    }
  }

  async getSessions(): Promise<Session[]> {
    return this.sessionService.getAll()
  }

  async createSession(sessionName: string, modelId: string): Promise<Session> {
    this.log.info('Creating session', { name: sessionName, modelId })
    const session = await this.sessionService.create({ name: sessionName, modelId })
    this.activeSession = session
    this.activeSessionMessages = []
    this.log.debug('Session created', { id: session.id })
    return session
  }

  async loadSession(session: Session, messages: ModelMessage[]): Promise<void> {
    this.log.info('Loading session', { id: session.id, name: session.name, messageCount: messages.length })
    this.activeSession = session
    this.activeSessionMessages = messages
  }

  async updateTitle(name: string, summary: string): Promise<void> {
    if (!this.activeSession) return
    this.log.info('Updating title', { name })
    await this.sessionService.update(this.activeSession.id, { name, summary })
    this.activeSession = { ...this.activeSession, name, summary }
  }

  async accumulateTokens(tokens: number): Promise<void> {
    if (!this.activeSession) return
    const totalTokens = (this.activeSession.totalTokens ?? 0) + tokens
    await this.sessionService.accumulateTokens(this.activeSession.id, tokens)
    this.activeSession = { ...this.activeSession, totalTokens }
  }

  async updateMetadata(patch: SessionMetadata): Promise<void> {
    if (!this.activeSession) return
    const existing = (this.activeSession.metadata ?? {}) as SessionMetadata
    const merged: SessionMetadata = {
      filesRead: [...new Set([...(existing.filesRead ?? []), ...(patch.filesRead ?? [])])],
      filesModified: [...new Set([...(existing.filesModified ?? []), ...(patch.filesModified ?? [])])],
      tags: [...new Set([...(existing.tags ?? []), ...(patch.tags ?? [])])],
    }
    this.log.debug('Updating metadata', {
      filesRead: merged.filesRead?.length,
      filesModified: merged.filesModified?.length,
    })
    await this.sessionService.update(this.activeSession.id, { metadata: merged })
    this.activeSession = { ...this.activeSession, metadata: merged }
  }

}
