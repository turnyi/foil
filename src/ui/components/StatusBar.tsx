import { Box, Text } from 'ink'

interface Props {
  modelId: string
  isThinking: boolean
}

export function StatusBar({ modelId, isThinking }: Props) {
  return (
    <Box paddingLeft={1}>
      <Text backgroundColor="magenta" color="white"> {isThinking ? 'Thinking' : 'Build'} </Text>
      <Text> </Text>
      <Text dimColor>{modelId}</Text>
      <Text color="gray"> · </Text>
      <Text dimColor>foil</Text>
    </Box>
  )
}
