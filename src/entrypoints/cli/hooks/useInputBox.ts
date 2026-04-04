import { useState, useEffect } from 'react'
import { useInput } from 'ink'
import { useMessageStore } from '../store/messageStore'
import { useSessionStore } from '../store/sessionStore'
import {
  detectMode,
  extractQuery,
  getSuggestions,
  applySuggestion,
} from '../helpers/suggestions'
import type { Suggestion } from '../components/atoms/SuggestionList'

export interface InputBoxState {
  value: string
  suggestions: Suggestion[]
  selectedIndex: number
  open: boolean
}

export function useInputBox(): InputBoxState {
  const sendMessage = useMessageStore(state => state.sendMessage)
  const openSessionPicker = useSessionStore(state => state.openSessionPicker)
  const [value, setValue] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)

  const mode = detectMode(value)
  const query = mode !== 'none' ? extractQuery(value, mode) : ''
  const suggestions = getSuggestions(mode, query)
  const open = suggestions.length > 0

  useEffect(() => { setSelectedIndex(0) }, [value])

  useInput((input, key) => {
    if (open) {
      if (key.upArrow)   { setSelectedIndex(i => Math.max(0, i - 1)); return }
      if (key.downArrow) { setSelectedIndex(i => Math.min(suggestions.length - 1, i + 1)); return }
      if (key.return) {
        const chosen = suggestions[selectedIndex]
        if (chosen) {
          const applied = applySuggestion(value, chosen, mode)
          if (applied === '/sessions') {
            openSessionPicker()
            setValue('')
          } else {
            setValue(applied)
          }
        }
        return
      }
    } else if (key.return) {
      if (value.trim()) {
        sendMessage(value)
        setValue('')
      }
      return
    }

    if (key.backspace || key.delete) { setValue(v => v.slice(0, -1)); return }
    if (key.ctrl || key.meta) return
    if (input) setValue(v => v + input)
  })

  return { value, suggestions, selectedIndex, open }
}
