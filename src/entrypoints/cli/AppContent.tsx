import React from 'react'
import { useApp, useInput } from 'ink'
import { useMessageStore } from './store/messageStore'
import { useSessionStore } from './store/sessionStore'
import SplashScreen from './components/organisms/SplashScreen'
import ChatView from './components/organisms/ChatView'
import SessionPicker from './components/organisms/SessionPicker'

export default function AppContent() {
  const { exit } = useApp()
  const messages = useMessageStore(state => state.messages)
  const sessionPickerOpen = useSessionStore(state => state.sessionPickerOpen)

  useInput((_input, key) => {
    if (key.escape && !sessionPickerOpen) exit()
  })

  if (sessionPickerOpen) return <SessionPicker />
  return messages.length === 0 ? <SplashScreen /> : <ChatView />
}
