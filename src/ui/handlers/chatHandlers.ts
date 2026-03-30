import type { StreamHandlers } from '../../runtime/ai/types/streamTypes'
import type { ChatMessage } from '../types'

let _id = 0
export const nextId = () => String(_id++)

type SetMessages = React.Dispatch<React.SetStateAction<ChatMessage[]>>
type UpdateMessage = (id: string, updater: (m: ChatMessage) => ChatMessage) => void

export const buildChatHandlers = (
  setMessages: SetMessages,
  updateMessage: UpdateMessage,
): StreamHandlers => {
  const toolTimes = new Map<string, number>()
  let thinkingId: string | null = null
  let assistantId: string | null = null

  return {
    onReasoningStart: () => {
      thinkingId = nextId()
      setMessages(prev => [...prev, { id: thinkingId!, type: 'thinking', text: '', streaming: true }])
    },
    onReasoning: text => {
      if (thinkingId) updateMessage(thinkingId, m =>
        m.type === 'thinking' ? { ...m, text: m.text + text } : m)
    },
    onReasoningEnd: () => {
      if (thinkingId) updateMessage(thinkingId, m =>
        m.type === 'thinking' ? { ...m, streaming: false } : m)
      thinkingId = null
    },

    onTextStart: () => {
      assistantId = nextId()
      setMessages(prev => [...prev, { id: assistantId!, type: 'assistant', text: '', streaming: true }])
    },
    onText: text => {
      if (assistantId) {
        updateMessage(assistantId, m =>
          m.type === 'assistant' ? { ...m, text: m.text + text } : m)
      } else {
        assistantId = nextId()
        const aid = assistantId
        setMessages(prev => [...prev, { id: aid, type: 'assistant', text, streaming: true }])
      }
    },
    onTextEnd: () => {
      if (assistantId) updateMessage(assistantId, m =>
        m.type === 'assistant' ? { ...m, streaming: false } : m)
      assistantId = null
    },

    onToolCall: toolName => {
      toolTimes.set(toolName, Date.now())
      const id = nextId()
      toolTimes.set(toolName + '__id', id as any)
      setMessages(prev => [...prev, { id, type: 'tool', name: toolName, running: true }])
    },
    onToolResult: (toolName, result) => {
      const start = toolTimes.get(toolName) ?? Date.now()
      const msgId = toolTimes.get(toolName + '__id') as unknown as string
      const elapsed = ((Date.now() - start) / 1000).toFixed(1)
      toolTimes.delete(toolName)
      toolTimes.delete(toolName + '__id')
      const out = JSON.stringify(result)
      const preview = out.length > 120 ? out.slice(0, 120) + '…' : out
      if (msgId) updateMessage(msgId, m =>
        m.type === 'tool' ? { ...m, running: false, elapsed, preview } : m)
    },
    onToolError: (toolName, err) => {
      const msgId = toolTimes.get(toolName + '__id') as unknown as string
      toolTimes.delete(toolName)
      toolTimes.delete(toolName + '__id')
      if (msgId) updateMessage(msgId, m =>
        m.type === 'tool' ? { ...m, running: false, error: String(err) } : m)
    },

    onError: err => {
      setMessages(prev => [...prev, { id: nextId(), type: 'error', text: String(err) }])
    },

    onUnhandled: () => { },
  }
}
