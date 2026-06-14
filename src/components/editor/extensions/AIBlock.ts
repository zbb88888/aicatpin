import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { AIBlockView } from '../components/AIBlockView'

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

// AI 块扩展配置
export interface AIBlockOptions {
  HTMLAttributes: Record<string, any>
}

// 声明 TipTap 模块类型
declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    aiBlock: {
      insertAIBlock: (attrs?: Partial<AIBlockAttrs>) => ReturnType
      updateAIBlock: (attrs: Partial<AIBlockAttrs>) => ReturnType
      setAIBlockStatus: (status: AIBlockStatus) => ReturnType
      setAIBlockContent: (content: string) => ReturnType
      setAIBlockError: (error: string) => ReturnType
    }
  }
}

// 创建 AI 块扩展
export const AIBlock = Node.create<AIBlockOptions>({
  name: 'aiBlock',

  group: 'block',

  content: 'inline*',

  defining: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  addAttributes() {
    return {
      status: {
        default: 'idle',
        parseHTML: (element) => element.getAttribute('data-status') || 'idle',
        renderHTML: (attributes) => ({
          'data-status': attributes.status,
        }),
      },
      prompt: {
        default: '',
        parseHTML: (element) => element.getAttribute('data-prompt') || '',
        renderHTML: (attributes) => ({
          'data-prompt': attributes.prompt,
        }),
      },
      content: {
        default: '',
      },
      error: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-error') || null,
        renderHTML: (attributes) => ({
          'data-error': attributes.error,
        }),
      },
      model: {
        default: 'llama2',
        parseHTML: (element) => element.getAttribute('data-model') || 'llama2',
        renderHTML: (attributes) => ({
          'data-model': attributes.model,
        }),
      },
      timestamp: {
        default: null,
        parseHTML: (element) => {
          const ts = element.getAttribute('data-timestamp')
          return ts ? parseInt(ts, 10) : null
        },
        renderHTML: (attributes) => ({
          'data-timestamp': attributes.timestamp?.toString(),
        }),
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="ai-block"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-type': 'ai-block',
      }),
      0,
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(AIBlockView)
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

      setAIBlockStatus:
        (status: AIBlockStatus) =>
        ({ commands }) => {
          return commands.updateAttributes(this.name, { status })
        },

      setAIBlockContent:
        (content: string) =>
        ({ commands }) => {
          return commands.updateAttributes(this.name, {
            content,
            status: 'complete',
          })
        },

      setAIBlockError:
        (error: string) =>
        ({ commands }) => {
          return commands.updateAttributes(this.name, {
            error,
            status: 'error',
          })
        },
    }
  },

  addKeyboardShortcuts() {
    return {
      'Mod-Shift-a': () => {
        return this.editor.commands.insertAIBlock()
      },
    }
  },
})