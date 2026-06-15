import { create } from 'zustand'
import { generateSubTopic } from '@/services/ai'

export type ViewMode = 'chat' | 'editor'

export interface ShuttlePayload {
  title?: string
  content: string
}

interface AppRouterState {
  currentView: ViewMode
  shuttleContext: string
  shuttlePayload: ShuttlePayload | null
  pinToEditor: (content: string) => Promise<void>
  pinToChat: (content: string) => void
  setShuttleContext: (text: string) => void
  clearShuttlePayload: () => void
  switchView: (view: ViewMode) => void
}

export const useAppRouter = create<AppRouterState>((set) => ({
  currentView: 'editor',
  shuttleContext: '',
  shuttlePayload: null,
  
  pinToEditor: async (content: string) => {
    try {
      // 调用 AI 服务生成子主题标题
      const title = await generateSubTopic(content)
      
      // 更新状态：切换到编辑器视图并设置 shuttlePayload
      set({
        currentView: 'editor',
        shuttlePayload: {
          title,
          content
        },
        shuttleContext: '' // 清空旧的 shuttleContext
      })
    } catch (error) {
      console.error('生成子主题标题失败:', error)
      
      // 降级处理：使用内容前10个字符作为标题
      const fallbackTitle = content.substring(0, 10).replace(/[#\n]/g, '').trim() || '未命名主题'
      
      set({
        currentView: 'editor',
        shuttlePayload: {
          title: fallbackTitle,
          content
        },
        shuttleContext: ''
      })
    }
  },
  
  pinToChat: (content: string) => {
    // 立即切换到聊天视图并设置 shuttlePayload
    set({
      currentView: 'chat',
      shuttlePayload: {
        content
      },
      shuttleContext: content // 同时设置 shuttleContext 以保持兼容性
    })
  },
  
  setShuttleContext: (text: string) => set({ shuttleContext: text }),
  
  clearShuttlePayload: () => set({ shuttlePayload: null }),
  
  switchView: (view: ViewMode) => set({ currentView: view }),
}))
