import type { ModelMessage } from 'ai'
import type { Session } from '../../../db/schema'

export default interface ISessionEngine {
  buildContext(promptMessage: ModelMessage, sessionId: string): Promise<ModelMessage[]>
  appendResponse(messages: ModelMessage[], sessionId: string): Promise<void>
  getSessions(): Promise<Session[]>
  getSession(id: string): Promise<Session>
  getMessages(sessionId: string): Promise<ModelMessage[]>
}
