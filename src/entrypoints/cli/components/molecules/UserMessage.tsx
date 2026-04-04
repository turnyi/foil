import React from 'react'
import { Box, Text } from 'ink'
import type { DisplayMessage } from '../../types'

type Props = { message: Extract<DisplayMessage, { type: 'user' }> }

export default function UserMessage({ message }: Props) {
  return (
    <Box gap={2} marginBottom={1}>
      <Text color="cyan" bold>you</Text>
      <Text>{message.content}</Text>
    </Box>
  )
}
