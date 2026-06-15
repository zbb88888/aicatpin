import { create } from 'zustand'

export type ViewMode = 'chat' | 'editor'

interface AppRouterState {
  currentView: ViewMode
  shuttleContext: string
  pinToEditor: (text: string) => void
  pinToChat: (text: string) => void
  setShuttleContext: (text: string) => void
  switchView: (view: ViewMode) => void
}

export const useAppRouter = create<AppRouterState>((set) => ({
  currentView: 'editor',
  shuttleContext: '',
  
  pinToEditor: (text: string) => set({
    currentView: 'editor',
    shuttleContext: text,
  }),
  
  pinToChat: (text: string) => set({
    currentView: 'chat',
    shuttleContext: text,
  }),
  
  setShuttleContext: (text: string) => set({ shuttleContext: text }),
  
  switchView: (view: ViewMode) => set({ currentView: view }),
}))
