import { Node, mergeAttributes } from '@tiptap/core'

// AI 块状态类型
export type AIBlockStatus = 'idle' | 'loading' | 'streaming' | 'complete' | 'error'

// AI 块属性接口
export interface AIBlockAttrs {
  status: AIBlockStatus
  prompt: string
  content: string
  error?: string
  model?: string
  timestamp?: number
}

// 声明 TipTap 模块类型
declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    aiBlock: {
      insertAIBlock: (attrs?: Partial<AIBlockAttrs>) => ReturnType
      updateAIBlock: (attrs: Partial<AIBlockAttrs>) => ReturnType
    }
  }
}

// 创建 AI 块扩展
export const AIBlock = Node.create({
  name: 'aiBlock',

  group: 'block',

  content: 'inline*',

  defining: true,

  addAttributes() {
    return {
      status: { default: 'idle' },
      prompt: { default: '' },
      content: { default: '' },
      error: { default: null },
      model: { default: 'gemma4:e2b' },
      timestamp: { default: null },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-type="ai-block"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'ai-block' }), 0]
  },

  addCommands() {
    return {
      insertAIBlock:
        (attrs?: Partial<AIBlockAttrs>) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: {
              status: 'loading',
              prompt: '',
              content: '',
              timestamp: Date.now(),
              ...attrs,
            },
          })
        },

      updateAIBlock:
        (attrs: Partial<AIBlockAttrs>) =>
        ({ commands }) => {
          return commands.updateAttributes(this.name, attrs)
        },
    }
  },
})