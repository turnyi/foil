import { useState } from 'react'
import { useEngineContext } from '../context/EngineContext'
import { buildChatHandlers, nextId } from '../handlers/chatHandlers'
import type { ModelMessage } from 'ai'
import type { TokenUsage } from '../../runtime/engine/types'
import type { Session } from '../../db/schema'
import type { ChatMessage } from '../types'

const extractText = (content: unknown): string => {
  if (typeof content === 'string') return content
  if (Array.isArray(content))
    return content.filter((p: any) => p.type === 'text').map((p: any) => p.text).join('')
  return ''
}

const toChatMessages = (messages: ModelMessage[]): ChatMessage[] =>
  messages.flatMap(m => {
    if (m.role === 'user')
      return [{ id: nextId(), type: 'user', text: extractText(m.content) }]
    if (m.role === 'assistant')
      return [{ id: nextId(), type: 'assistant', text: extractText(m.content), streaming: false }]
    return []
  })

const useChat = () => {
  const { engine } = useEngineContext()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isThinking, setIsThinking] = useState(false)
  const [usage, setUsage] = useState<TokenUsage>({ totalTokens: 0 })
  const [currentSession, setCurrentSession] = useState<Session | null>(null)
  const [sessionTokens, setSessionTokens] = useState(0)

  const updateMessage = (id: string, updater: (m: ChatMessage) => ChatMessage) =>
    setMessages(prev => prev.map(m => m.id === id ? updater(m) : m))

  const send = async (text: string) => {
    if (!engine) return

    setMessages(prev => [...prev, { id: nextId(), type: 'user', text }])
    setIsThinking(true)

    try {
      const result = await engine.ask(text, buildChatHandlers(setMessages, updateMessage))
      setUsage(result)
      setSessionTokens(prev => prev + (result.totalTokens ?? 0))
      // refresh session after ask — title may have been generated
      const session = engine.getCurrentSession()
      if (session) setCurrentSession({ ...session })
    } catch (err) {
      setMessages(prev => [...prev, { id: nextId(), type: 'error', text: String(err) }])
    } finally {
      setIsThinking(false)
    }
  }

  const reset = (modelMessages: ModelMessage[], session?: Session) => {
    setMessages(toChatMessages(modelMessages))
    setUsage({ totalTokens: 0 })
    setCurrentSession(session ?? null)
    setSessionTokens(session?.totalTokens ?? 0)
  }

  const contextWindow = engine?.getContextWindow()

  return { messages, isThinking, usage, currentSession, sessionTokens, contextWindow, send, reset }
}

export default useChat
