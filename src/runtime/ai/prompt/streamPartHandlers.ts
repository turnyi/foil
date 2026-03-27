import { StreamPartType, type StreamHandlers } from "../types/streamTypes"

const streamPartHandlers: Partial<Record<StreamPartType, (part: any, h: StreamHandlers) => void>> = {
  [StreamPartType.TextDelta]: (p, h) => h.onText?.(p.text),
  [StreamPartType.TextStart]: (_, h) => h.onTextStart?.(),
  [StreamPartType.TextEnd]: (_, h) => h.onTextEnd?.(),
  [StreamPartType.ReasoningDelta]: (p, h) => h.onReasoning?.(p.text),
  [StreamPartType.ReasoningStart]: (_, h) => h.onReasoningStart?.(),
  [StreamPartType.ReasoningEnd]: (_, h) => h.onReasoningEnd?.(),
  [StreamPartType.ToolCall]: (p, h) => h.onToolCall?.(p.toolName, p.args ?? p.input),
  [StreamPartType.ToolResult]: (p, h) => h.onToolResult?.(p.toolName, p.result ?? p.output),
  [StreamPartType.ToolError]: (p, h) => h.onToolError?.(p.toolName, p.error),
  [StreamPartType.ToolInputStart]: (p, h) => h.onToolInputStart?.(p.toolName),
  [StreamPartType.ToolInputDelta]: (p, h) => h.onToolInputDelta?.(p.toolName, p.inputTextDelta), //TODO
  [StreamPartType.ToolInputEnd]: (p, h) => h.onToolInputEnd?.(p.toolName),
  [StreamPartType.ToolOutputDenied]: (p, h) => h.onToolOutputDenied?.(p.toolName),
  [StreamPartType.ToolApprovalRequest]: (p, h) => h.onToolApprovalRequest?.(p.toolName),
  [StreamPartType.Error]: (p, h) => h.onError?.(p.error),
  [StreamPartType.Abort]: (p, h) => h.onAbort?.(p.reason),
  [StreamPartType.StartStep]: (_, h) => h.onStepStart?.(),
  [StreamPartType.FinishStep]: (_, h) => h.onStepFinish?.(),
  [StreamPartType.Start]: (_, h) => h.onStart?.(),
  [StreamPartType.Finish]: (p, h) => h.onFinish?.(p.finishReason, p.totalUsage),
  [StreamPartType.Source]: (p, h) => h.onSource?.(p),
  [StreamPartType.File]: (p, h) => h.onFile?.(p),
  [StreamPartType.Raw]: (p, h) => h.onRaw?.(p),
}

export default streamPartHandlers
