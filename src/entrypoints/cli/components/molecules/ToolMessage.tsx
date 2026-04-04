import React from 'react'
import { Box, Text } from 'ink'
import type { DisplayMessage } from '../../types'

type Props = { message: Extract<DisplayMessage, { type: 'tool' }> }

function formatArgs(args?: Record<string, unknown>): string {
  if (!args) return ''
  const entries = Object.entries(args)
  if (entries.length === 0) return ''

  if (entries.length === 1) {
    const [, v] = entries[0]!
    const str = typeof v === 'string' ? v : JSON.stringify(v)
    return str.length > 80 ? str.slice(0, 77) + '…' : str
  }

  const parts = entries.map(([k, v]) => {
    const str = typeof v === 'string' ? v : JSON.stringify(v)
    const truncated = str.length > 40 ? str.slice(0, 37) + '…' : str
    return `${k}=${truncated}`
  })
  const joined = parts.join(', ')
  return joined.length > 100 ? joined.slice(0, 97) + '…' : joined
}

function formatResult(result: unknown): string | null {
  if (result === undefined || result === null) return null
  const str = typeof result === 'string' ? result : JSON.stringify(result)
  // Trim to a reasonable preview — first non-empty line or first 120 chars
  const firstLine = str.split('\n').find(l => l.trim().length > 0) ?? str
  return firstLine.length > 120 ? firstLine.slice(0, 117) + '…' : firstLine
}

export default function ToolMessage({ message }: Props) {
  const args = formatArgs(message.args)
  const result = message.status !== 'running' ? formatResult(message.result) : null
  const statusIcon = message.status === 'running' ? '···' : message.status === 'done' ? '✓' : '✗'
  const statusColor = message.status === 'error' ? 'red' : 'gray'

  return (
    <Box flexDirection="column" marginBottom={1}>
      <Box gap={1}>
        <Text color="yellow">tool</Text>
        <Text color="white" bold>{message.name}</Text>
        <Text color="gray">(</Text>
        {args ? <Text color="cyan">{args}</Text> : null}
        <Text color="gray">)</Text>
        <Text color={statusColor}>{statusIcon}</Text>
      </Box>
      {result && (
        <Box marginLeft={5}>
          <Text color="gray" dimColor>{result}</Text>
        </Box>
      )}
    </Box>
  )
}
