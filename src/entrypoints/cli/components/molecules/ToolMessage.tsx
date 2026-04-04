import React from 'react'
import { Box, Text } from 'ink'
import type { DisplayMessage } from '../../types'

type Props = { message: Extract<DisplayMessage, { type: 'tool' }> }

export default function ToolMessage({ message }: Props) {
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
