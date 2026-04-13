import React from 'react'
import { Box, Static, useStdout } from 'ink'
import { useMessageStore } from '../../store/messageStore'
import MessageBubble from '../molecules/MessageBubble'
import PromptInput from '../molecules/PromptInput'

export default function ChatView() {
  const { stdout } = useStdout()
  const columns = stdout.columns ?? 80

  const messages = useMessageStore(state => state.messages)
  const isStreaming = useMessageStore(state => state.isStreaming)

  // Everything before the last user message is completed history — render once via Static so it scrolls naturally.
  // The current turn (last user message + its responses) stays live for streaming updates.
  const lastUserIdx = isStreaming
    ? [...messages].map((m, i) => (m.type === 'user' ? i : -1)).filter(i => i !== -1).at(-1) ?? -1
    : -1

  const staticMessages = lastUserIdx > 0 ? messages.slice(0, lastUserIdx) : isStreaming ? [] : messages
  const activeMessages = lastUserIdx >= 0 ? messages.slice(lastUserIdx) : []

  return (
    <Box flexDirection="column" width={columns - 2} paddingX={1}>
      <Static items={staticMessages}>
        {(msg) => <MessageBubble key={msg.id} message={msg} />}
      </Static>
      <Box flexDirection="column">
        {activeMessages.map(msg => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        <PromptInput />
      </Box>
    </Box>
  )
}
