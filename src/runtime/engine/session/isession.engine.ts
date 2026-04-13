import type { ModelMessage } from 'ai'
import type { StreamHandlers } from '../../ai/types/streamTypes'

export default interface ISessionEngine {
  buildContext(promptMessage: ModelMessage, sessionId: string): Promise<ModelMessage[]>
  getStreamHandlers(sessionId: string): StreamHandlers
}
