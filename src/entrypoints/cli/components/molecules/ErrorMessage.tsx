import React from 'react'
import { Box, Text } from 'ink'
import type { DisplayMessage } from '../../types'

type Props = { message: Extract<DisplayMessage, { type: 'error' }> }

export default function ErrorMessage({ message }: Props) {
  return (
    <Box gap={2} marginBottom={1} borderStyle="round" borderColor="red" paddingX={1}>
      <Text color="red" bold>error</Text>
      <Text color="red">{message.message}</Text>
    </Box>
  )
}
