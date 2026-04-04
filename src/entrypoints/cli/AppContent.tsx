import React from 'react'
import { useApp, useInput } from 'ink'
import { useEngineStore } from './store/engineStore'
import SplashScreen from './components/organisms/SplashScreen'
import ChatView from './components/organisms/ChatView'

export default function AppContent() {
  const { exit } = useApp()
  const messages = useEngineStore(state => state.messages)

  useInput((_input, key) => {
    if (key.escape) exit()
  })

  return messages.length === 0 ? <SplashScreen /> : <ChatView />
}
