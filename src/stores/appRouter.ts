import { create } from 'zustand'
import { generateSubTopic } from '@/services/ai'

export type ViewMode = 'chat' | 'editor'

export interface ShuttlePayload {
  title?: string
  content: string
}

interface AppRouterState {
  currentView: ViewMode
  shuttlePayload: ShuttlePayload | null
  pinToEditor: (content: string) => Promise<void>
  pinToChat: (content: string) => void
  clearShuttlePayload: () => void
  switchView: (view: ViewMode) => void
}

export const useAppRouter = create<AppRouterState>((set) => ({
  currentView: 'editor',
  shuttlePayload: null,
  
  pinToEditor: async (content: string) => {
    try {
      const title = await generateSubTopic(content)
      set({
        currentView: 'editor',
        shuttlePayload: { title, content }
      })
    } catch (error) {
      console.error('生成子主题标题失败:', error)
      const fallbackTitle = content.substring(0, 10).replace(/[#\n]/g, '').trim() || '未命名主题'
      set({
        currentView: 'editor',
        shuttlePayload: { title: fallbackTitle, content }
      })
    }
  },
  
  pinToChat: (content: string) => {
    set({
      currentView: 'chat',
      shuttlePayload: { content }
    })
  },
  
  clearShuttlePayload: () => set({ shuttlePayload: null }),
  
  switchView: (view: ViewMode) => set({ currentView: view }),
}))
