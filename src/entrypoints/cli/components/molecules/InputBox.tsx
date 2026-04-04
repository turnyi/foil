import React from 'react'
import { Box, Text } from 'ink'
import { useEngineStore } from '../../store/engineStore'
import TextInput from '../atoms/TextInput'

interface Props {
  value: string
}

export default function InputBox({ value }: Props) {
  const modelName = useEngineStore(state => state.modelName)

  return (
    <Box
      flexDirection="column"
      width={64}
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
      </Box>
    </Box>
  )
}
