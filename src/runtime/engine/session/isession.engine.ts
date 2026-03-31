import type { ModelMessage } from "ai"
import type { Session } from "../../../db/schema"
import type { SessionMetadata } from "../types"

export default interface ISessionEngine {
  hasActiveSession(): boolean
  getActiveSession(): Session | undefined
  buildContext(promptMessage: ModelMessage): Promise<ModelMessage[]>
  appendResponse(messages: ModelMessage[]): Promise<void>
  getSessions(): Promise<Session[]>
  createSession(sessionName: string, modelId: string): Promise<Session>
  loadSession(session: Session, messages: ModelMessage[]): Promise<void>
  updateTitle(name: string, summary: string): Promise<void>
  updateMetadata(patch: SessionMetadata): Promise<void>
  accumulateTokens(tokens: number): Promise<void>
}

