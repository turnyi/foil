import { Box, Text } from 'ink'
import type { ChatMessage } from '../types'
import { Message } from './Message'

interface Props {
  messages: ChatMessage[]
  isThinking: boolean
  spinFrame: number
}

export function ChatPane({ messages, isThinking, spinFrame }: Props) {
  if (messages.length === 0) return null

  return (
    <Box flexDirection="column" flexGrow={1} overflow="hidden">
      {messages.map(msg => (
        <Message key={msg.id} message={msg} spinFrame={spinFrame} />
      ))}
      {isThinking && messages[messages.length - 1]?.type === 'user' && (
        <Box>
          <Text color="gray">
            {'⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏'[spinFrame % 10]}
          </Text>
          <Text dimColor> thinking...</Text>
        </Box>
      )}
    </Box>
  )
}
