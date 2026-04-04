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

function dbToDisplay(msg: Message): DisplayMessage {
  if (msg.role === 'user') {
    return {
      id: msg.id,
      type: 'user',
      content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content),
    }
  }
  if (msg.role === 'tool') {
    const c = msg.content as Record<string, unknown> | null
    return { id: msg.id, type: 'tool', name: (c?.toolName as string) ?? 'tool', status: 'done' }
  }
  return {
    id: msg.id,
    type: 'assistant',
    content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content),
    streaming: false,
    tokens: msg.tokens ?? undefined,
  }
}

export const useMessageStore = create<MessageStore>((set, get) => ({
  messages: [],
  isStreaming: false,
  contextUsage: 0,

  loadMessages: async (sessionId) => {
    const repo = container.resolve(MessageRepository)
    const msgs = await repo.getBySession(sessionId)
    set({ messages: msgs.map(dbToDisplay) })
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

      onToolCall: async toolName => {
        set(state => ({
          messages: [
            ...state.messages,
            { id: randomUUID(), type: 'tool', name: toolName, status: 'running' as const },
          ],
        }))
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
        const usage = totalUsage as { promptTokens?: number; completionTokens?: number } | null
        set(state => ({
          messages: state.messages.map(m =>
            m.id === assistantId && m.type === 'assistant'
              ? { ...m, streaming: false, tokens: usage?.completionTokens }
              : m,
          ),
          isStreaming: false,
          contextUsage: usage?.promptTokens ?? state.contextUsage,
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
