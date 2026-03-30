import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { Engine } from '../../runtime/engine'
import MessageSession from '../../runtime/engine/session/message.session'
import { appContainer } from '../../runtime/services/AppContainer'
import type { Session } from '../../db/schema'

export type EngineState =
  | { status: 'loading' }
  | { status: 'error'; message: string; issue: string }
  | { status: 'ready'; modelId: string }

interface EngineContextValue {
  state: EngineState
  engine: Engine | null
  session: MessageSession | null
  start: () => void
}

const EngineContext = createContext<EngineContextValue | null>(null)

export const EngineProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<EngineState>({ status: 'loading' })
  const [engine, setEngine] = useState<Engine | null>(null)
  const [session, setSession] = useState<MessageSession | null>(null)

  const start = useCallback(() => {
    setState({ status: 'loading' })
    const { sessionService, messageService } = appContainer.services
    const newSession = new MessageSession(sessionService, messageService)
    const newEngine = new Engine({ session: newSession, messageService })
    newEngine.ready.then(async result => {
      if (!result.success) {
        setState({
          status: 'error',
          message: result.message ?? 'Engine failed to start',
          issue: result.issue ?? '',
        })
        return
      }
      const modelId = (await newEngine.getModel() as any)?.modelId ?? 'unknown'
      setEngine(newEngine)
      setSession(newSession)
      setState({ status: 'ready', modelId })
    })
  }, [])

  useEffect(() => { start() }, [])

  return (
    <EngineContext.Provider value={{ state, engine, session, start }}>
      {children}
    </EngineContext.Provider>
  )
}

export const useEngineContext = () => {
  const ctx = useContext(EngineContext)
  if (!ctx) throw new Error('useEngineContext must be used within EngineProvider')
  return ctx
}
