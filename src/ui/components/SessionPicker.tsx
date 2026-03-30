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

    if (key.upArrow) {
      setCursor(c => Math.max(0, c - 1))
      return
    }
    if (key.downArrow) {
      setCursor(c => Math.min(sessions.length - 1, c + 1))
      return
    }
    if (key.return && sessions.length > 0) {
      onSelect(sessions[cursor]!)
      return
    }
  })

  return (
    <Box
      position="absolute"
      flexDirection="column"
      borderStyle="round"
      borderColor="cyan"
      paddingX={1}
      width={50}
    >
      <Text bold color="cyan">Select session</Text>
      <Text dimColor>↑↓ navigate  Enter select  Esc close</Text>
      <Box marginTop={1} flexDirection="column">
        {sessions.length === 0
          ? <Text dimColor>No sessions found</Text>
          : sessions.map((s, i) => (
            <Box key={s.id}>
              <Text color={i === cursor ? 'cyan' : undefined}>
                {i === cursor ? '› ' : '  '}
                {s.name}
              </Text>
              <Text dimColor> {s.createdAt.toISOString().slice(0, 10)}</Text>
            </Box>
          ))
        }
      </Box>
    </Box>
  )
}
