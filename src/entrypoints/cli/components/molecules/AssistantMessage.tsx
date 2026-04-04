import React, { useMemo } from 'react'
import { Box, Text } from 'ink'
import Spinner from 'ink-spinner'
import { Marked } from 'marked'
import { markedTerminal } from 'marked-terminal'
import chalk from 'chalk'
import { useEngineStore } from '../../store/engineStore'
import type { DisplayMessage } from '../../types'

const md = new Marked()
md.use(markedTerminal({
  showSectionPrefix: false,
  firstHeading: chalk.bold.white.underline,
  heading: chalk.bold.white,
  codespan: chalk.yellow,
}))

type Props = { message: Extract<DisplayMessage, { type: 'assistant' }> }

export default function AssistantMessage({ message }: Props) {
  const contextWindow = useEngineStore(state => state.contextWindow)
  const rendered = useMemo(() => md.parse(message.content) as string, [message.content])

  const pct = contextWindow && message.tokens
    ? Math.round((message.tokens / contextWindow) * 100)
    : null

  const isThinking = message.streaming && !message.content && !message.reasoning

  return (
    <Box flexDirection="column" marginBottom={1}>
      <Box gap={2} alignItems="flex-start">
        <Text color="white" bold>foil</Text>
        <Box flexDirection="column" flexShrink={1}>

          {/* Thinking spinner — no content yet */}
          {isThinking && (
            <Box gap={1}>
              <Text color="yellow"><Spinner type="dots" /></Text>
              <Text dimColor>thinking</Text>
            </Box>
          )}

          {/* Reasoning — shown while streaming, hidden after */}
          {message.reasoning && message.streaming && (
            <Box flexDirection="column" marginBottom={1}>
              <Text dimColor italic>reasoning</Text>
              <Text dimColor>{message.reasoning}</Text>
            </Box>
          )}

          {/* Main content */}
          {message.content ? (
            <Text>{rendered}{message.streaming ? '▋' : ''}</Text>
          ) : null}

        </Box>
      </Box>

      {!message.streaming && message.tokens !== undefined && (
        <Box marginLeft={6} gap={2}>
          <Text dimColor>{message.tokens} tokens</Text>
          {pct !== null && <Text dimColor>{pct}% ctx</Text>}
          {message.reasoning && <Text dimColor>reasoned</Text>}
        </Box>
      )}
    </Box>
  )
}
