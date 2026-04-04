import { create } from 'zustand'
import { container } from '../../../di/container'
import { SessionService } from '../../../runtime/services/SessionService'
import type { Session } from '../../../db/schema'

interface SessionStore {
  sessionId: string | null
  sessionPickerOpen: boolean
  sessionList: Session[]
  setSessionId: (id: string) => void
  ensureSession: (name: string) => Promise<string>
  openSessionPicker: () => Promise<void>
  closeSessionPicker: () => void
  loadSession: (id: string) => Promise<void>
}

export const useSessionStore = create<SessionStore>((set, get) => ({
  sessionId: null,
  sessionPickerOpen: false,
  sessionList: [],

  setSessionId: (id) => set({ sessionId: id }),

  ensureSession: async (name) => {
    const existing = get().sessionId
    if (existing) return existing

    try {
      const sessionService = container.resolve(SessionService)
      const session = await sessionService.create({ name })
      set({ sessionId: session.id })
      return session.id
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      throw new Error(`Failed to create session: ${message}`)
    }
  },

  openSessionPicker: async () => {
    const sessionService = container.resolve(SessionService)
    const sessions = await sessionService.getAll()
    set({ sessionPickerOpen: true, sessionList: sessions })
  },

  closeSessionPicker: () => set({ sessionPickerOpen: false }),

  loadSession: async (id) => {
    set({ sessionId: id, sessionPickerOpen: false })
    // Lazy import to avoid circular dep at module load time
    const { useMessageStore } = await import('./messageStore')
    await useMessageStore.getState().loadMessages(id)
  },
}))
