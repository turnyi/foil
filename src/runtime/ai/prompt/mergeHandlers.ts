import type { StreamHandlers } from '../types/streamTypes'

const mergeHandlers = (...handlers: StreamHandlers[]): StreamHandlers => {
  const allKeys = [...new Set(handlers.flatMap(h => Object.keys(h)))] as (keyof StreamHandlers)[]
  const merged: StreamHandlers = {}

  for (const key of allKeys) {
    merged[key] = ((...args: any[]) => {
      for (const h of handlers) {
        ;(h[key] as ((...a: any[]) => void) | undefined)?.(...args)
      }
    }) as any
  }

  return merged
}

export default mergeHandlers
