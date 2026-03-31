import { useEffect, useRef, useState } from 'react'
import { Box, Text, useApp, useInput } from 'ink'
import { useEngineContext } from './context/EngineContext'
import useChat from './hooks/useChat'
import { SessionPicker } from './components/SessionPicker'
import { ChatPane } from './components/ChatPane'
import { Sidebar } from './components/Sidebar'
import { InputBar } from './components/InputBar'
import { StatusBar } from './components/StatusBar'
import { Welcome } from './components/Welcome'

export default function App() {
  const { exit } = useApp()
  const { state: engineState, engine, start: startEngine } = useEngineContext()
  const { messages, isThinking, currentSession, sessionTokens, contextWindow, send, reset } = useChat()
  const [input, setInput] = useState('')
  const [spinFrame, setSpinFrame] = useState(0)
  const [showSessionPicker, setShowSessionPicker] = useState(false)
  const sessionStart = useRef(new Date())

  useEffect(() => {
    const t = setInterval(() => setSpinFrame(f => f + 1), 80)
    return () => clearInterval(t)
  }, [])

  useInput((char, key) => {
    if (engineState.status === 'error') {
      if (key.return) startEngine()
      return
    }

    if (engineState.status !== 'ready') return

    if (key.ctrl && char === 'p') {
      setShowSessionPicker(v => !v)
      return
    }

    if (showSessionPicker) return

    if (key.return) {
      const text = input.trim()
      if (!text || isThinking) return
      if (['/exit', '/quit'].includes(text)) { exit(); return }
      setInput('')
      send(text)
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
            <Sidebar sessionTokens={sessionTokens} contextWindow={contextWindow} currentSession={currentSession} modelId={modelId} sessionStart={sessionStart.current} />
          </>
          : <Welcome modelId={modelId} isReady={isReady} spinFrame={spinFrame} />
        }
      </Box>
      <InputBar value={input} isThinking={isThinking} />
      <StatusBar modelId={modelId} isThinking={isThinking} />
      {showSessionPicker && engine && (
        <SessionPicker
          engine={engine}
          onSelect={async session => {
            const loaded = await engine.loadSession(session)
            reset(loaded, session)
            setShowSessionPicker(false)
          }}
          onClose={() => setShowSessionPicker(false)}
        />
      )}
    </Box>
  )
}
