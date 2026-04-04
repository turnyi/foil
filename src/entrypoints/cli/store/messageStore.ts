import { create } from 'zustand'
import { randomUUID } from 'crypto'
import { container } from '../../../di/container'
import { MessageRepository } from '../../../db/repositories/MessageRepository'
import { useSessionStore } from './sessionStore'
import { getEngine } from './engineStore'
import type { StreamHandlers } from '../../../runtime/ai/types/streamTypes'
import type { Message } from '../../../db/schema'
import type { DisplayMessage } from '../types'

interface MessageStore {
  messages: DisplayMessage[]
  isStreaming: boolean
  contextUsage: number
  loadMessages: (sessionId: string) => Promise<void>
  sendMessage: (text: string) => Promise<void>
}

type ContentPart = { type: string; text?: string; toolName?: string; [key: string]: unknown }

function extractText(content: unknown): string {
  if (typeof content === 'string') return content
  if (Array.isArray(content)) {
    return (content as ContentPart[])
      .filter(p => p.type === 'text')
      .map(p => p.text ?? '')
      .join('')
  }
  return ''
}

function extractToolName(content: unknown): string {
  if (!content || typeof content !== 'object') return 'tool'
  if (Array.isArray(content)) {
    const first = (content as ContentPart[])[0]
    return (first?.toolName as string) ?? 'tool'
  }
  return ((content as Record<string, unknown>).toolName as string) ?? 'tool'
}

function extractToolArgs(content: unknown): Record<string, unknown> | undefined {
  if (!content || typeof content !== 'object') return undefined
  if (Array.isArray(content)) {
    const first = (content as ContentPart[])[0]
    const args = first?.args ?? first?.input
    return args && typeof args === 'object' ? args as Record<string, unknown> : undefined
  }
  const c = content as Record<string, unknown>
  const args = c.args ?? c.input
  return args && typeof args === 'object' ? args as Record<string, unknown> : undefined
}

function dbToDisplay(msg: Message): DisplayMessage | null {
  if (msg.role === 'user') {
    return { id: msg.id, type: 'user', content: extractText(msg.content) }
  }
  if (msg.role === 'tool') {
    return {
      id: msg.id,
      type: 'tool',
      name: extractToolName(msg.content),
      args: extractToolArgs(msg.content),
      status: 'done',
    }
  }
  if (msg.role === 'assistant') {
    const text = extractText(msg.content)
    if (!text) return null  // pure tool-call assistant turns, no text to show
    return { id: msg.id, type: 'assistant', content: text, streaming: false, tokens: msg.tokens ?? undefined }
  }
  return null
}

export const useMessageStore = create<MessageStore>((set, get) => ({
  messages: [],
  isStreaming: false,
  contextUsage: 0,

  loadMessages: async (sessionId) => {
    const repo = container.resolve(MessageRepository)
    const msgs = await repo.getBySession(sessionId)
    set({ messages: msgs.map(dbToDisplay).filter((m): m is DisplayMessage => m !== null) })
  },

  sendMessage: async (text) => {
    const { isStreaming } = get()
    if (isStreaming || !text.trim()) return

    const assistantId = randomUUID()
    set(state => ({
      messages: [
        ...state.messages,
        { id: randomUUID(), type: 'user', content: text },
        { id: assistantId, type: 'assistant', content: '', streaming: true },
      ],
      isStreaming: true,
    }))

    const sessionId = await useSessionStore.getState().ensureSession(text.slice(0, 60))

    const handlers: StreamHandlers = {
      onText: async chunk => {
        set(state => ({
          messages: state.messages.map(m =>
            m.id === assistantId && m.type === 'assistant'
              ? { ...m, content: m.content + chunk }
              : m,
          ),
        }))
      },

      onToolCall: async (toolName, args) => {
        set(state => {
          const toolMsg = {
            id: randomUUID(),
            type: 'tool' as const,
            name: toolName,
            status: 'running' as const,
            args: args && typeof args === 'object' ? args as Record<string, unknown> : undefined,
          }
          const assistantIdx = state.messages.findIndex(m => m.id === assistantId)
          if (assistantIdx === -1) return { messages: [...state.messages, toolMsg] }
          const msgs = [...state.messages]
          msgs.splice(assistantIdx, 0, toolMsg)
          return { messages: msgs }
        })
      },

      onToolResult: async toolName => {
        set(state => {
          const idx = [...state.messages]
            .reverse()
            .findIndex(m => m.type === 'tool' && m.name === toolName && m.status === 'running')
          if (idx === -1) return state
          const real = state.messages.length - 1 - idx
          return {
            messages: state.messages.map((m, i) =>
              i === real && m.type === 'tool' ? { ...m, status: 'done' as const } : m,
            ),
          }
        })
      },

      onFinish: async (_reason: string, totalUsage: unknown) => {
        const usage = totalUsage as { inputTokens?: number; outputTokens?: number } | null
        set(state => ({
          messages: state.messages.map(m =>
            m.id === assistantId && m.type === 'assistant'
              ? { ...m, streaming: false, tokens: usage?.outputTokens }
              : m,
          ),
          isStreaming: false,
          contextUsage: usage?.inputTokens ?? state.contextUsage,
        }))
      },

      onError: async () => {
        set(state => ({
          messages: state.messages.map(m =>
            m.id === assistantId && m.type === 'assistant' ? { ...m, streaming: false } : m,
          ),
          isStreaming: false,
        }))
      },
    }

    try {
      await getEngine().ask(text, sessionId, [handlers])
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      set(state => ({
        messages: state.messages.map(m =>
          m.id === assistantId ? { id: assistantId, type: 'error' as const, message } : m,
        ),
        isStreaming: false,
      }))
    }
  },
}))
