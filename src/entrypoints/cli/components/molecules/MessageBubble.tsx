import React from 'react'
import type { DisplayMessage } from '../../types'
import UserMessage from './UserMessage'
import AssistantMessage from './AssistantMessage'
import ToolMessage from './ToolMessage'
import ErrorMessage from './ErrorMessage'

const MESSAGE_REGISTRY: { [K in DisplayMessage['type']]: React.ComponentType<{ message: Extract<DisplayMessage, { type: K }> }> } = {
  user: UserMessage,
  assistant: AssistantMessage,
  tool: ToolMessage,
  error: ErrorMessage,
}

interface Props {
  message: DisplayMessage
}

export default function MessageBubble({ message }: Props) {
  const Component = MESSAGE_REGISTRY[message.type] as React.ComponentType<{ message: DisplayMessage }>
  return <Component message={message} />
}
