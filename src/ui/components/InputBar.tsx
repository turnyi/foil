import { Box, Text } from 'ink'

interface Props {
  value: string
  isThinking: boolean
  placeholder?: string
}

export function InputBar({ value, isThinking, placeholder = 'Ask anything...' }: Props) {
  return (
    <Box borderStyle="single" borderTop borderBottom={false} borderLeft={false} borderRight={false} borderColor="gray" paddingLeft={1}>
      <Text color={isThinking ? 'gray' : 'white'}>❯ </Text>
      {value
        ? <Text>{value}<Text backgroundColor="white" color="black"> </Text></Text>
        : isThinking
          ? <Text dimColor>waiting for response...</Text>
          : <Text dimColor>{placeholder}<Text backgroundColor="gray" color="black"> </Text></Text>
      }
    </Box>
  )
}
