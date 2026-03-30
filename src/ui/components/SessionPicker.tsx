import { useEffect, useState } from 'react'
import { Box, Text, useInput } from 'ink'
import type { Session } from '../../db/schema'

interface Props {
  engine: import('../../runtime/engine').Engine
  onSelect: (session: Session) => void
  onClose: () => void
}

export function SessionPicker({ engine, onSelect, onClose }: Props) {
  const [sessions, setSessions] = useState<Session[]>([])
  const [cursor, setCursor] = useState(0)

  useEffect(() => {
    engine.getSessions().then(setSessions)
  }, [])

  useInput((_, key) => {
    if (key.escape) { onClose(); return }
    if (key.upArrow) { setCursor(c => Math.max(0, c - 1)); return }
    if (key.downArrow) { setCursor(c => Math.min(sessions.length - 1, c + 1)); return }
    if (key.return && sessions.length > 0) { onSelect(sessions[cursor]!); return }
  })

  const width = Math.min(80, process.stdout.columns - 4)

  return (
    <Box position="absolute" width="100%" height="100%" alignItems="center" justifyContent="center">
      <Box
        flexDirection="column"
        borderStyle="round"
        borderColor="cyan"
        paddingX={2}
        paddingY={1}
        width={width}
        backgroundColor="black"
      >
        <Box marginBottom={1} flexDirection="column">
          <Text bold color="cyan">Sessions</Text>
          <Text dimColor>↑↓ navigate · Enter select · Esc close</Text>
        </Box>

        {sessions.length === 0
          ? <Text dimColor>No sessions found</Text>
          : sessions.map((s, i) => {
            const active = i === cursor
            return (
              <Box key={s.id} flexDirection="column" marginBottom={i < sessions.length - 1 ? 1 : 0}>
                <Box>
                  <Text color={active ? 'cyan' : 'white'} bold={active}>
                    {active ? '› ' : '  '}
                    {s.name}
                  </Text>
                  <Text dimColor>  {s.createdAt.toISOString().slice(0, 10)}</Text>
                </Box>
                {s.summary && (
                  <Text dimColor>{'  '}{s.summary}</Text>
                )}
              </Box>
            )
          })
        }
      </Box>
    </Box>
  )
}
