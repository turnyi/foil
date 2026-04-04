export type DisplayMessage =
  | { id: string; type: 'user'; content: string }
  | { id: string; type: 'assistant'; content: string; reasoning?: string; streaming: boolean; tokens?: number }
  | { id: string; type: 'tool'; name: string; status: 'running' | 'done' | 'error'; args?: Record<string, unknown>; result?: unknown }
  | { id: string; type: 'error'; message: string }
