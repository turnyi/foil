import { Box, Text } from 'ink'
import type { Session } from '../../db/schema'

interface Props {
  sessionTokens: number
  contextWindow: number | undefined
  currentSession: Session | null
  modelId: string
  sessionStart: Date
}

export function Sidebar({ sessionTokens, contextWindow, currentSession, modelId, sessionStart }: Props) {
  const date = sessionStart.toISOString().replace('T', ' ').slice(0, 19) + 'Z'
  const title = currentSession?.name ?? 'New session'
  const tokens = sessionTokens.toLocaleString()
  const pct = contextWindow && sessionTokens > 0
    ? Math.round((sessionTokens / contextWindow) * 10000) / 100
    : null

  return (
    <Box flexDirection="column" width={24} paddingLeft={1} borderStyle="single" borderLeft borderRight={false} borderTop={false} borderBottom={false} borderColor="gray">
      <Text bold>{title}</Text>
      <Text dimColor>{date}</Text>
      <Text> </Text>

      <Text bold>Context</Text>
      <Text>{tokens} tokens{pct !== null ? ` · ${pct}%` : ''}</Text>
      <Text> </Text>

      <Text bold>Model</Text>
      <Text dimColor>{modelId}</Text>
    </Box>
  )
}
