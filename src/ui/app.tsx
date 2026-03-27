import { useCallback, useEffect, useRef, useState } from 'react'
import { Box, Text, useApp, useInput } from 'ink'
import { Engine } from '../runtime/engine'
import type { TokenUsage } from '../runtime/engine/types'
import type { ChatMessage } from './types'
import { ChatPane } from './components/ChatPane'
import { Sidebar } from './components/Sidebar'
import { InputBar } from './components/InputBar'
import { StatusBar } from './components/StatusBar'
import { Welcome } from './components/Welcome'

let _id = 0
const nextId = () => String(_id++)

type EngineState =
  | { status: 'loading' }
  | { status: 'error'; message: string; issue: string }
  | { status: 'ready'; engine: Engine; modelId: string }

export default function App() {
  const { exit } = useApp()
  const [engineState, setEngineState] = useState<EngineState>({ status: 'loading' })
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isThinking, setIsThinking] = useState(false)
  const [usage, setUsage] = useState<TokenUsage>({ totalTokens: 0 })
  const [spinFrame, setSpinFrame] = useState(0)
  const sessionStart = useRef(new Date())

  const startEngine = useCallback(() => {
    setEngineState({ status: 'loading' })
    const engine = new Engine()
    engine.ready.then(async result => {
      if (!result.success) {
        setEngineState({
          status: 'error',
          message: result.message ?? 'Engine failed to start',
          issue: result.issue ?? '',
        })
        return
      }
      const modelId = (await engine.getModel() as any)?.modelId ?? 'unknown'
      setEngineState({ status: 'ready', engine, modelId })
    })
  }, [])

  useEffect(() => { startEngine() }, [])

  // Spin animation
  useEffect(() => {
    const t = setInterval(() => setSpinFrame(f => f + 1), 80)
    return () => clearInterval(t)
  }, [])

  const updateMessage = (id: string, updater: (m: ChatMessage) => ChatMessage) =>
    setMessages(prev => prev.map(m => m.id === id ? updater(m) : m))

  const handleSend = async (engine: Engine, text: string) => {
    setMessages(prev => [...prev, { id: nextId(), type: 'user', text }])
    setIsThinking(true)

    const toolTimes = new Map<string, number>()
    let thinkingId: string | null = null
    let assistantId: string | null = null

    try {
      const { messages: responseMessages, ...u } = await engine.ask(text, {
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
      })
      setUsage(u)
    } catch (err) {
      setMessages(prev => [...prev, { id: nextId(), type: 'error', text: String(err) }])
    } finally {
      setIsThinking(false)
    }
  }

  useInput((char, key) => {
    if (engineState.status === 'error') {
      if (key.return) startEngine()
      return
    }

    if (engineState.status !== 'ready') return

    if (key.return) {
      const text = input.trim()
      if (!text || isThinking) return
      if (['/exit', '/quit'].includes(text)) { exit(); return }
      setInput('')
      handleSend(engineState.engine, text)
      return
    }

    if (isThinking) return

    if (key.backspace || key.delete) {
      setInput(prev => prev.slice(0, -1))
      return
    }

    if (!key.ctrl && !key.meta && char) {
      setInput(prev => prev + char)
    }
  })

  if (engineState.status === 'error') {
    return (
      <Box flexDirection="column" height={process.stdout.rows} alignItems="center" justifyContent="center" gap={1}>
        <Text color="red" bold>{engineState.message}</Text>
        {engineState.issue ? <Text color="gray">{engineState.issue}</Text> : null}
        <Text dimColor>Press <Text color="white">Enter</Text> to retry or <Text color="white">Ctrl+C</Text> to quit</Text>
      </Box>
    )
  }

  const isReady = engineState.status === 'ready'
  const modelId = engineState.status === 'ready' ? engineState.modelId : ''
  const showChat = messages.length > 0

  return (
    <Box flexDirection="column" height={process.stdout.rows}>
      <Box flexGrow={1} overflow="hidden">
        {showChat
          ? <>
            <ChatPane messages={messages} isThinking={isThinking} spinFrame={spinFrame} />
            <Sidebar usage={usage} modelId={modelId} sessionStart={sessionStart.current} />
          </>
          : <Welcome modelId={modelId} isReady={isReady} spinFrame={spinFrame} />
        }
      </Box>
      <InputBar value={input} isThinking={isThinking} />
      <StatusBar modelId={modelId} isThinking={isThinking} />
    </Box>
  )
}
