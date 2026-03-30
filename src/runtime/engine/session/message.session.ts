import type { ModelMessage } from "ai";
import type { Session } from "../../../db/schema";
import type { MessageService, SessionService } from "../../services";
import type ISessionEngine from "./isession.engine";
import type { SessionMetadata } from "../types";

export default class MessageSession implements ISessionEngine {
  private sessionService: SessionService;
  private messageService: MessageService;
  private activeSession?: Session
  private activeSessionMessages?: ModelMessage[]

  constructor(sessionService: SessionService, messageService: MessageService) {
    this.sessionService = sessionService
    this.messageService = messageService
  }

  hasActiveSession(): boolean {
    return !!this.activeSession
  }

  async buildContext(promptMessage: ModelMessage): Promise<ModelMessage[]> {
    if (!this.activeSession) throw new Error('No active session. Call loadSession() first.')
    if (!this.activeSessionMessages)
      this.activeSessionMessages = []
    this.activeSessionMessages.push(promptMessage)
    await this.messageService.create({ sessionId: this.activeSession.id, role: promptMessage.role, content: promptMessage.content })
    return this.activeSessionMessages
  }

  async appendResponse(messages: ModelMessage[]): Promise<void> {
    if (!this.activeSession) throw new Error('No active session. Call loadSession() first.')
    if (!this.activeSessionMessages)
      this.activeSessionMessages = []
    for (const msg of messages) {
      this.activeSessionMessages.push(msg)
      await this.messageService.create({ sessionId: this.activeSession.id, role: msg.role, content: msg.content })
    }
  }

  async getSessions(): Promise<Session[]> {
    return this.sessionService.getAll()
  }

  async createSession(sessionName: string, modelId: string): Promise<Session> {
    const session = await this.sessionService.create({ name: sessionName, modelId })
    this.activeSession = session
    this.activeSessionMessages = []
    return session
  }

  async loadSession(session: Session, messages: ModelMessage[]): Promise<void> {
    this.activeSession = session
    this.activeSessionMessages = messages
  }

  async updateTitle(name: string, summary: string): Promise<void> {
    if (!this.activeSession) return
    await this.sessionService.update(this.activeSession.id, { name, summary })
  }

  async updateMetadata(patch: SessionMetadata): Promise<void> {
    if (!this.activeSession) return
    const existing = (this.activeSession.metadata ?? {}) as SessionMetadata
    const merged: SessionMetadata = {
      filesRead: [...new Set([...(existing.filesRead ?? []), ...(patch.filesRead ?? [])])],
      filesModified: [...new Set([...(existing.filesModified ?? []), ...(patch.filesModified ?? [])])],
      tags: [...new Set([...(existing.tags ?? []), ...(patch.tags ?? [])])],
    }
    await this.sessionService.update(this.activeSession.id, { metadata: merged })
    this.activeSession = { ...this.activeSession, metadata: merged }
  }

}
