import type { ModelMessage } from "ai"
import type { Session } from "../../../db/schema"

export default interface ISessionEngine {
  hasActiveSession(): boolean
  buildContext(promptMessage: ModelMessage): Promise<ModelMessage[]>
  appendResponse(messages: ModelMessage[]): Promise<void>
  getSessions(): Promise<Session[]>
  createSession(sessionName: string, modelId: string): Promise<Session>
  loadSession(session: Session, messages: ModelMessage[]): Promise<void>
}

