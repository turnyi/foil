import { Box, Text } from 'ink'
import type { ChatMessage } from '../types'
import { Markdown } from './Markdown'

const SPIN_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']

function SpinFrame({ frame }: { frame: number }) {
  return <Text color="gray">{SPIN_FRAMES[frame % SPIN_FRAMES.length]}</Text>
}

export function Message({ message, spinFrame }: { message: ChatMessage; spinFrame: number }) {
  switch (message.type) {
    case 'user':
      return (
        <Box marginBottom={1}>
          <Text color="gray">│ </Text>
          <Markdown text={message.text} />
        </Box>
      )

    case 'thinking':
      return (
        <Box flexDirection="column" marginBottom={message.streaming ? 0 : 1}>
          <Box>
            <Text backgroundColor="yellow" color="black"> Thinking </Text>
            <Text> </Text>
            <Text color="gray" dimColor>{message.text}</Text>
            {message.streaming && <SpinFrame frame={spinFrame} />}
          </Box>
        </Box>
      )

    case 'assistant':
      return (
        <Box marginBottom={message.streaming ? 0 : 1}>
          <Markdown text={message.text} />
          {message.streaming && <SpinFrame frame={spinFrame} />}
        </Box>
      )

    case 'tool':
      return (
        <Box flexDirection="column" marginBottom={1}>
          <Box>
            <Text color="magenta">  ✦ </Text>
            <Text bold>{message.name}</Text>
            {message.running
              ? <><Text color="gray"> · </Text><SpinFrame frame={spinFrame} /></>
              : message.error
                ? <><Text color="gray"> · </Text><Text color="red">error</Text></>
                : <><Text color="gray"> · </Text><Text dimColor>{message.elapsed}s</Text></>
            }
          </Box>
          {message.preview && (
            <Box paddingLeft={4}>
              <Text color="gray" dimColor>{message.preview}</Text>
            </Box>
          )}
          {message.error && (
            <Box paddingLeft={4}>
              <Text color="red">{message.error}</Text>
            </Box>
          )}
        </Box>
      )

    case 'error':
      return (
        <Box marginBottom={1}>
          <Text color="red">error: </Text>
          <Text dimColor>{message.text}</Text>
        </Box>
      )
  }
}
