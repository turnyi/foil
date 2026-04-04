import React from 'react'
import { Box, Text } from 'ink'

interface Props {
  value: string
  placeholder?: string
}

export default function TextInput({ value, placeholder = '' }: Props) {
  return (
    <Box>
      {value.length === 0 ? (
        <>
          <Text inverse> </Text>
          <Text dimColor>{placeholder}</Text>
        </>
      ) : (
        <>
          <Text color="white">{value}</Text>
          <Text inverse> </Text>
        </>
      )}
    </Box>
  )
}
