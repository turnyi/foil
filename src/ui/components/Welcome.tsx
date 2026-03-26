import { Box, Text } from 'ink'

const LOGO = [
  '███████╗ ██████╗ ██╗██╗     ',
  '██╔════╝██╔═══██╗██║██║     ',
  '█████╗  ██║   ██║██║██║     ',
  '██╔══╝  ██║   ██║██║██║     ',
  '██║     ╚██████╔╝██║███████╗',
  '╚═╝      ╚═════╝ ╚═╝╚══════╝',
]

interface Props {
  modelId: string
  isReady: boolean
  spinFrame: number
}

const SPIN_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']

export function Welcome({ modelId, isReady, spinFrame }: Props) {
  return (
    <Box flexDirection="column" alignItems="center" justifyContent="center" flexGrow={1} paddingY={2}>
      {LOGO.map((line, i) => (
        <Text key={i} color="white">{line}</Text>
      ))}
      <Text> </Text>
      <Text dimColor>AI coding assistant</Text>
      <Text> </Text>
      {isReady
        ? <Text dimColor>Ask anything  ·  <Text color="gray">/exit</Text> to quit</Text>
        : <Box><Text color="gray">{SPIN_FRAMES[spinFrame % SPIN_FRAMES.length]} </Text><Text dimColor>loading model...</Text></Box>
      }
    </Box>
  )
}
