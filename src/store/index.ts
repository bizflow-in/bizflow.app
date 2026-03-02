import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/types'

interface AppStore {
  user: User | null
  language: 'en' | 'hi'
  sidebarOpen: boolean
  setUser: (user: User | null) => void
  setLanguage: (lang: 'en' | 'hi') => void
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      user: null,
      language: 'en',
      sidebarOpen: true,
      setUser: (user) => set({ user }),
      setLanguage: (language) => set({ language }),
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
    }),
    {
      name: 'bizflow-store',
      partialize: (state) => ({ language: state.language }),
    }
  )
)
