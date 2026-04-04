import React from 'react'
import { Box, Text } from 'ink'

export interface Suggestion {
  label: string
  hint?: string
}

interface Props {
  items: Suggestion[]
  selectedIndex: number
}

export default function SuggestionList({ items, selectedIndex }: Props) {
  return (
    <Box flexDirection="column" backgroundColor="#111111" paddingX={2} paddingY={0} width={64} marginBottom={1}>
      {items.map((item, i) => {
        const active = i === selectedIndex
        return (
          <Box key={item.label} gap={2}>
            <Text bold={active} color={active ? 'white' : 'gray'}>
              {active ? '▶ ' : '  '}
              {item.label}
            </Text>
            {item.hint && <Text dimColor>{item.hint}</Text>}
          </Box>
        )
      })}
    </Box>
  )
}
