import type { ModelMessage } from 'ai'
import type { StreamHandlers } from '../../ai/types/streamTypes'

export default interface ISessionEngine {
  buildContext(promptMessage: ModelMessage, sessionId: string): Promise<ModelMessage[]>
  appendResponse(messages: ModelMessage[], sessionId: string): Promise<void>
  getStreamHandlers(sessionId: string): StreamHandlers
}
