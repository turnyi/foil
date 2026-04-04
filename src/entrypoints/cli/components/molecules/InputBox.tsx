import React from 'react'
import { Box, Text } from 'ink'
import { useEngineStore } from '../../store/engineStore'
import { useMessageStore } from '../../store/messageStore'
import TextInput from '../atoms/TextInput'

interface Props {
  value: string
  width?: number
}

export default function InputBox({ value, width = 64 }: Props) {
  const modelName = useEngineStore(state => state.modelName)
  const contextWindow = useEngineStore(state => state.contextWindow)
  const contextUsage = useMessageStore(state => state.contextUsage)

  const pct = contextWindow && contextUsage > 0
    ? Math.round((contextUsage / contextWindow) * 100)
    : null

  return (
    <Box
      flexDirection="column"
      width={width}
      paddingX={2}
      paddingY={1}
      borderStyle="bold"
      borderLeft={true}
      borderTop={false}
      borderRight={false}
      borderBottom={false}
      borderColor="white"
      backgroundColor="#111111"
    >
      <TextInput value={value} placeholder="Ask anything..." />
      <Box marginTop={1} gap={2}>
        <Text color="white" bold>foil</Text>
        <Text dimColor>{modelName}</Text>
        {pct !== null && (
          <Text dimColor>{contextUsage.toLocaleString()} / {contextWindow!.toLocaleString()} ctx ({pct}%)</Text>
        )}
      </Box>
    </Box>
  )
}
