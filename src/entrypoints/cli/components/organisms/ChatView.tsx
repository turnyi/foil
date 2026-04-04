import React from 'react'
import { Box, useStdout } from 'ink'
import { useMessageStore } from '../../store/messageStore'
import MessageBubble from '../molecules/MessageBubble'
import PromptInput from '../molecules/PromptInput'

export default function ChatView() {
  const { stdout } = useStdout()
  const columns = stdout.columns ?? 80
  const rows = stdout.rows ?? 24

  const messages = useMessageStore(state => state.messages)

  return (
    <Box flexDirection="column" width={columns - 2} height={rows - 2} paddingX={2} paddingY={2}>
      <Box flexDirection="column" flexGrow={1}>
        {messages.map(msg => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
      </Box>

      <Box alignItems="center" justifyContent="center">
        <PromptInput />
      </Box>
    </Box>
  )
}
