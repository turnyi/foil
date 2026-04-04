import React from 'react'
import { Box, Text, useStdout } from 'ink'
import Logo from '../atoms/Logo'
import PromptInput from '../molecules/PromptInput'

export default function SplashScreen() {
  const { stdout } = useStdout()
  const rows = stdout.rows ?? 24
  const columns = stdout.columns ?? 80

  return (
    <Box
      flexDirection="column"
      width={columns}
      height={rows}
      alignItems="center"
      justifyContent="center"
    >
      <Box flexDirection="column" alignItems="center">
        <Box marginBottom={2}>
          <Logo />
        </Box>

        <PromptInput />

        <Box gap={3} marginTop={2}>
          <Box gap={1}>
            <Text dimColor>enter</Text>
            <Text color="white">submit</Text>
          </Box>
          <Box gap={1}>
            <Text dimColor>esc</Text>
            <Text color="white">quit</Text>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}
