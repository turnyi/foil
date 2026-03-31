import type { ModelMessage } from "ai"
import type { Session } from "../../../db/schema"
import type ISessionEngine from "./isession.engine"
import type { SessionMetadata } from "../types"

export default class MemorySession implements ISessionEngine {
  private messages: ModelMessage[] = []

  hasActiveSession(): boolean {
    return true
  }

  getActiveSession(): Session | undefined {
    return undefined
  }

  async buildContext(promptMessage: ModelMessage): Promise<ModelMessage[]> {
    this.messages.push(promptMessage)
    return this.messages
  }

  async appendResponse(messages: ModelMessage[]): Promise<void> {
    this.messages.push(...messages)
  }

  async getSessions(): Promise<Session[]> {
    return []
  }

  async createSession(_sessionName: string, _modelId: string): Promise<Session> {
    throw new Error('MemorySession does not support persistent sessions.')
  }

  async loadSession(_session: Session, messages: ModelMessage[]): Promise<void> {
    this.messages = [...messages]
  }

  async updateTitle(_name: string, _summary: string): Promise<void> { }
  async updateMetadata(_patch: SessionMetadata): Promise<void> { }
  async accumulateTokens(_tokens: number): Promise<void> { }
}
