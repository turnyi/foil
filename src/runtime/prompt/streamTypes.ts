export enum StreamPartType {
  Start = 'start',
  Finish = 'finish',
  Abort = 'abort',

  TextStart = 'text-start',
  TextDelta = 'text-delta',
  TextEnd = 'text-end',

  ReasoningStart = 'reasoning-start',
  ReasoningDelta = 'reasoning-delta',
  ReasoningEnd = 'reasoning-end',

  ToolInputStart = 'tool-input-start',
  ToolInputDelta = 'tool-input-delta',
  ToolInputEnd = 'tool-input-end',

  ToolCall = 'tool-call',
  ToolResult = 'tool-result',
  ToolError = 'tool-error',
  ToolOutputDenied = 'tool-output-denied',
  ToolApprovalRequest = 'tool-approval-request',

  StartStep = 'start-step',
  FinishStep = 'finish-step',

  Source = 'source',
  File = 'file',
  Raw = 'raw',
  Error = 'error',
}

export interface StreamHandlers {
  onText?: (text: string) => void
  onTextStart?: () => void
  onTextEnd?: () => void
  onReasoning?: (text: string) => void
  onReasoningStart?: () => void
  onReasoningEnd?: () => void
  onToolCall?: (toolName: string, args: unknown) => void
  onToolResult?: (toolName: string, result: unknown) => void
  onToolError?: (toolName: string, error: unknown) => void
  onToolInputStart?: (toolName: string) => void
  onToolInputDelta?: (toolName: string, delta: string) => void
  onToolInputEnd?: (toolName: string) => void
  onToolOutputDenied?: (toolName: string) => void
  onToolApprovalRequest?: (toolName: string) => void
  onError?: (error: unknown) => void
  onAbort?: (reason?: string) => void
  onStepStart?: () => void
  onStepFinish?: () => void
  onStart?: () => void
  onFinish?: (finishReason: string, totalUsage: unknown) => void
  onSource?: (source: unknown) => void
  onFile?: (file: unknown) => void
  onRaw?: (raw: unknown) => void
  onUnhandled?: (part: unknown) => void
}
