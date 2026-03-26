export type UserMessage     = { id: string; type: 'user';      text: string }
export type AssistantMessage = { id: string; type: 'assistant'; text: string; streaming: boolean }
export type ThinkingMessage  = { id: string; type: 'thinking';  text: string; streaming: boolean }
export type ToolMessage      = { id: string; type: 'tool';      name: string; running: boolean; elapsed?: string; preview?: string; error?: string }
export type ErrorMessage     = { id: string; type: 'error';     text: string }

export type ChatMessage =
  | UserMessage
  | AssistantMessage
  | ThinkingMessage
  | ToolMessage
  | ErrorMessage
