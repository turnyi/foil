import React from 'react'
import { Box, Text } from 'ink'
import type { DisplayMessage } from '../../types'

interface Props {
  message: DisplayMessage
}

export default function MessageBubble({ message }: Props) {
  if (message.type === 'user') {
    return (
      <Box gap={2} marginBottom={1}>
        <Text color="cyan" bold>you</Text>
        <Text>{message.content}</Text>
      </Box>
    )
  }

  if (message.type === 'assistant') {
    return (
      <Box gap={2} marginBottom={1}>
        <Text color="white" bold>foil</Text>
        <Box flexDirection="column">
          <Text>
            {message.content}
            {message.streaming && <Text dimColor>▋</Text>}
          </Text>
        </Box>
      </Box>
    )
  }

  if (message.type === 'error') {
    return (
      <Box gap={2} marginBottom={1} borderStyle="round" borderColor="red" paddingX={1}>
        <Text color="red" bold>error</Text>
        <Text color="red">{message.message}</Text>
      </Box>
    )
  }

  return (
    <Box gap={2} marginBottom={1}>
      <Text color="yellow">tool</Text>
      <Text dimColor>{message.name}</Text>
      <Text dimColor>
        {message.status === 'running' ? '···' : message.status === 'done' ? '✓' : '✗'}
      </Text>
    </Box>
  )
}
