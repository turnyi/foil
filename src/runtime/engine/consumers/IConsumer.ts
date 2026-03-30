import type { StreamHandlers } from "../../ai/types/streamTypes"

export default interface IConsumer {
  getHandlers(): StreamHandlers
}
