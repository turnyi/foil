import type { ModelMessage } from 'ai'
import type { Session } from '../../../db/schema'
import type { StreamHandlers } from '../../ai/types/streamTypes'

export default interface ISessionEngine {
  buildContext(promptMessage: ModelMessage, sessionId: string): Promise<ModelMessage[]>
  appendResponse(messages: ModelMessage[], sessionId: string): Promise<void>
  getSessions(): Promise<Session[]>
  getSession(id: string): Promise<Session>
  getMessages(sessionId: string): Promise<ModelMessage[]>
  getStreamHandlers(sessionId: string): StreamHandlers
}
