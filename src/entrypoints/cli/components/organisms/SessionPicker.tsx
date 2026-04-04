import React, { useState } from 'react'
import { Box, Text, useInput, useStdout } from 'ink'
import { useSessionStore } from '../../store/sessionStore'

export default function SessionPicker() {
  const { stdout } = useStdout()
  const columns = stdout.columns ?? 80
  const rows = stdout.rows ?? 24

  const sessionList = useSessionStore(state => state.sessionList)
  const closeSessionPicker = useSessionStore(state => state.closeSessionPicker)
  const loadSession = useSessionStore(state => state.loadSession)

  const [selectedIndex, setSelectedIndex] = useState(0)

  useInput((_input, key) => {
    if (key.escape) { closeSessionPicker(); return }
    if (key.upArrow) { setSelectedIndex(i => Math.max(0, i - 1)); return }
    if (key.downArrow) { setSelectedIndex(i => Math.min(sessionList.length - 1, i + 1)); return }
    if (key.return) {
      const session = sessionList[selectedIndex]
      if (session) loadSession(session.id)
    }
  })

  return (
    <Box width={columns} height={rows} alignItems="center" justifyContent="center">
      <Box
        flexDirection="column"
        width={64}
        borderStyle="round"
        borderColor="white"
        paddingX={2}
        paddingY={1}
        backgroundColor="#111111"
      >
        <Box marginBottom={1}>
          <Text bold>sessions</Text>
        </Box>

        {sessionList.length === 0 && (
          <Text dimColor>no sessions yet</Text>
        )}

        {sessionList.map((session, i) => {
          const active = i === selectedIndex
          return (
            <Box key={session.id} gap={2}>
              <Text bold={active} color={active ? 'white' : 'gray'}>
                {active ? '▶' : ' '} {session.name}
              </Text>
              <Text dimColor>
                {session.updatedAt.toLocaleDateString()}
              </Text>
            </Box>
          )
        })}

        <Box marginTop={1} gap={3}>
          <Box gap={1}>
            <Text dimColor>enter</Text>
            <Text color="white">select</Text>
          </Box>
          <Box gap={1}>
            <Text dimColor>esc</Text>
            <Text color="white">cancel</Text>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}
