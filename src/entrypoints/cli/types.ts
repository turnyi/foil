export type DisplayMessage =
  | { id: string; type: 'user'; content: string }
  | { id: string; type: 'assistant'; content: string; streaming: boolean; tokens?: number }
  | { id: string; type: 'tool'; name: string; status: 'running' | 'done' | 'error' }
  | { id: string; type: 'error'; message: string }
  | { id: string; type: 'error'; message: string }
