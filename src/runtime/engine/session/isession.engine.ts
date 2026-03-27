import type { ModelMessage } from "ai"
import type { Session } from "../../../db/schema"

export default interface ISessionEngine {
  buildContext(promptMessage: ModelMessage): Promise<ModelMessage[]>
  createSession(sessionName: string, modelId: string): Promise<Session>
  loadSession(session: Session, messages: ModelMessage[]): Promise<void>
}

