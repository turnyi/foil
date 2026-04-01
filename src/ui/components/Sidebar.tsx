import { Box, Text } from 'ink'
import { basename } from 'path'
import type { Session } from '../../db/schema'
import type { SessionMetadata } from '../../runtime/engine/types'

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

  const metadata = (currentSession?.metadata ?? {}) as SessionMetadata
  const filesRead = metadata.filesRead ?? []
  const filesModified = metadata.filesModified ?? []

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

      {filesModified.length > 0 && (
        <>
          <Text> </Text>
          <Text bold>Modified</Text>
          {filesModified.map(f => (
            <Text key={f} color="yellow" dimColor>  {basename(f)}</Text>
          ))}
        </>
      )}

      {filesRead.length > 0 && (
        <>
          <Text> </Text>
          <Text bold>Read</Text>
          {filesRead.map(f => (
            <Text key={f} dimColor>  {basename(f)}</Text>
          ))}
        </>
      )}
    </Box>
  )
}
