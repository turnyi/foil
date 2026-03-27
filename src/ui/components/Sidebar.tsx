import { Box, Text } from 'ink'
import type { TokenUsage } from '../../runtime/engine/types'

interface Props {
  usage: TokenUsage
  modelId: string
  sessionStart: Date
}

export function Sidebar({ usage, modelId, sessionStart }: Props) {
  const date = sessionStart.toISOString().replace('T', ' ').slice(0, 19) + 'Z'
  const tokens = (usage.totalTokens ?? 0).toLocaleString()
  const ctx = usage.contextUsagePercent ?? 0

  return (
    <Box flexDirection="column" width={24} paddingLeft={1} borderStyle="single" borderLeft borderRight={false} borderTop={false} borderBottom={false} borderColor="gray">
      <Text bold>New session</Text>
      <Text dimColor>{date}</Text>
      <Text> </Text>

      <Text bold>Context</Text>
      <Text>{tokens} tokens</Text>
      <Text dimColor>{ctx}% used</Text>
      <Text> </Text>

      <Text bold>Model</Text>
      <Text dimColor>{modelId}</Text>
    </Box>
  )
}
