import React from 'react'
import { Box, Text } from 'ink'
import type { DisplayMessage } from '../../types'

type Props = { message: Extract<DisplayMessage, { type: 'user' }> }

export default function UserMessage({ message }: Props) {
  return (
    <Box
      marginBottom={1}
      paddingX={2}
      paddingY={1}
      backgroundColor="#111111"
      borderStyle="bold"
      borderLeft={true}
      borderTop={false}
      borderRight={false}
      borderBottom={false}
      borderColor="cyan"
    >
      <Text>{message.content}</Text>
    </Box>
  )
}
