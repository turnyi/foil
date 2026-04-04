import { readdirSync } from 'fs'
import type { Suggestion } from '../components/atoms/SuggestionList'

export type SuggestionMode = 'command' | 'file' | 'none'

export const COMMANDS: Suggestion[] = [
  { label: '/new',      hint: 'start a new session' },
  { label: '/sessions', hint: 'switch session' },
]

export function detectMode(value: string): SuggestionMode {
  if (value.startsWith('/')) return 'command'
  if (/@\S*$/.test(value)) return 'file'
  return 'none'
}

export function extractQuery(value: string, mode: SuggestionMode): string {
  if (mode === 'command') return value.slice(1).toLowerCase()
  const match = value.match(/@(\S*)$/)
  return match?.[1]?.toLowerCase() ?? ''
}

export function getSuggestions(mode: SuggestionMode, query: string): Suggestion[] {
  if (mode === 'command') {
    return COMMANDS.filter(c => c.label.slice(1).startsWith(query))
  }
  if (mode === 'file') {
    try {
      return readdirSync('.')
        .filter(f => !f.startsWith('.') && f.toLowerCase().includes(query))
        .slice(0, MAX_SUGGESTIONS)
        .map(f => ({ label: f }))
    } catch {
      return []
    }
  }
  return []
}

export function applySuggestion(value: string, chosen: Suggestion, mode: SuggestionMode): string {
  if (mode === 'command') return chosen.label
  const atIdx = value.lastIndexOf('@')
  return value.slice(0, atIdx + 1) + chosen.label
}

export const MAX_SUGGESTIONS = 5
