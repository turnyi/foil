import type { Output } from 'ai'

export type TextOutput = ReturnType<typeof Output.text>

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
  onText?: (text: string) => Promise<void>
  onTextStart?: () => Promise<void>
  onTextEnd?: () => Promise<void>
  onReasoning?: (text: string) => Promise<void>
  onReasoningStart?: () => Promise<void>
  onReasoningEnd?: () => Promise<void>
  onToolCall?: (toolCallId: string, toolName: string, args: unknown) => Promise<void>
  onToolResult?: (toolCallId: string, toolName: string, result: unknown) => Promise<void>
  onToolError?: (toolCallId: string, toolName: string, error: unknown) => Promise<void>
  onToolInputStart?: (toolName: string) => Promise<void>
  onToolInputDelta?: (toolName: string, delta: string) => Promise<void>
  onToolInputEnd?: (toolName: string) => Promise<void>
  onToolOutputDenied?: (toolName: string) => Promise<void>
  onToolApprovalRequest?: (toolName: string) => Promise<void>
  onError?: (error: unknown) => Promise<void>
  onAbort?: (reason?: string) => Promise<void>
  onStepStart?: () => Promise<void>
  onStepFinish?: () => Promise<void>
  onStart?: () => Promise<void>
  onFinish?: (finishReason: string, totalUsage: unknown) => Promise<void>
  onSource?: (source: unknown) => Promise<void>
  onFile?: (file: unknown) => Promise<void>
  onRaw?: (raw: unknown) => Promise<void>
  onUnhandled?: (part: unknown) => Promise<void>
}
