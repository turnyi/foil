import React, { useMemo } from 'react'
import { Box, Text } from 'ink'
import { Marked } from 'marked'
import { markedTerminal } from 'marked-terminal'
import type { DisplayMessage } from '../../types'

const md = new Marked()
md.use(markedTerminal())

type Props = { message: Extract<DisplayMessage, { type: 'assistant' }> }

export default function AssistantMessage({ message }: Props) {
  const rendered = useMemo(() => md.parse(message.content) as string, [message.content])

  return (
    <Box flexDirection="column" marginBottom={1}>
      <Box gap={2} alignItems="flex-start">
        <Text color="white" bold>foil</Text>
        <Box flexDirection="column" flexShrink={1}>
          <Text>{rendered}{message.streaming ? '▋' : ''}</Text>
        </Box>
      </Box>
      {!message.streaming && message.tokens !== undefined && (
        <Box marginLeft={6}>
          <Text dimColor>{message.tokens} tokens</Text>
        </Box>
      )}
    </Box>
  )
}
