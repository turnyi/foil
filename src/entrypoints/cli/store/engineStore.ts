import { create } from 'zustand'
import { randomUUID } from 'crypto'
import { container } from '../../../di/container'
import type Engine from '../../../runtime/engine'
import { SessionService } from '../../../runtime/services/SessionService'
import type { StreamHandlers } from '../../../runtime/ai/types/streamTypes'
import type { DisplayMessage } from '../types'

interface EngineStore {
  messages: DisplayMessage[]
  sessionId: string | null
  isStreaming: boolean
  modelName: string
  sendMessage: (text: string) => Promise<void>
}

let _engine: Engine

export function initEngineStore(engine: Engine, modelName: string) {
  _engine = engine
  useEngineStore.setState({ modelName })
}

export const useEngineStore = create<EngineStore>((set, get) => ({
  messages: [],
  sessionId: null,
  isStreaming: false,
  modelName: '',

  sendMessage: async (text: string) => {
    const { isStreaming, sessionId } = get()
    if (isStreaming || !text.trim()) return

    let sid = sessionId
    if (!sid) {
      try {
        const sessionService = container.resolve(SessionService)
        const session = await sessionService.create({ name: text.slice(0, 60) })
        sid = session.id
        set({ sessionId: sid })
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        set(state => ({
          messages: [
            ...state.messages,
            { id: randomUUID(), type: 'user' as const, content: text },
            { id: randomUUID(), type: 'error' as const, message: `Session error: ${message}` },
          ],
        }))
        return
      }
    }

    const assistantId = randomUUID()

    set(state => ({
      messages: [
        ...state.messages,
        { id: randomUUID(), type: 'user', content: text },
        { id: assistantId, type: 'assistant', content: '', streaming: true },
      ],
      isStreaming: true,
    }))

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

      onFinish: async () => {
        set(state => ({
          messages: state.messages.map(m =>
            m.id === assistantId && m.type === 'assistant' ? { ...m, streaming: false } : m,
          ),
          isStreaming: false,
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
      await _engine.ask(text, sid, [handlers])
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
