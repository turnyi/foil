import React from 'react'
import { Box, Text } from 'ink'
import type { DisplayMessage } from '../../types'

type Props = { message: Extract<DisplayMessage, { type: 'tool' }> }

function argsSummary(name: string, args?: Record<string, unknown>): string | null {
  if (!args) return null
  const candidates: (string | undefined)[] = [
    args.command as string,
    args.file_path as string,
    args.path as string,
    args.pattern as string,
    args.query as string,
    args.url as string,
  ]
  const value = candidates.find(v => typeof v === 'string' && v.length > 0)
  if (value) return value.length > 60 ? value.slice(0, 57) + '…' : value

  for (const v of Object.values(args)) {
    if (typeof v === 'string' && v.length > 0) {
      return v.length > 60 ? v.slice(0, 57) + '…' : v
    }
  }
  return null
}

export default function ToolMessage({ message }: Props) {
  const summary = argsSummary(message.name, message.args)
  const statusIcon = message.status === 'running' ? '···' : message.status === 'done' ? '✓' : '✗'
  const statusColor = message.status === 'error' ? 'red' : 'white'

  return (
    <Box gap={2} marginBottom={1}>
      <Text color="yellow">tool</Text>
      <Text dimColor>{message.name}</Text>
      {summary && <Text color="gray">{summary}</Text>}
      <Text color={statusColor} dimColor={message.status !== 'error'}>{statusIcon}</Text>
    </Box>
  )
}
