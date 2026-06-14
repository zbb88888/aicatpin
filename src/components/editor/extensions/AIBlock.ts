import { Node, mergeAttributes } from '@tiptap/core'

export type AIBlockStatus = 'idle' | 'loading' | 'streaming' | 'complete' | 'error'

export interface AIBlockAttrs {
  status: AIBlockStatus
  prompt: string
  content: string
  error?: string
  model?: string
  timestamp?: number
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    aiBlock: {
      insertAIBlock: (attrs?: Partial<AIBlockAttrs>) => ReturnType
      updateAIBlock: (attrs: Partial<AIBlockAttrs>) => ReturnType
    }
  }
}

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
      insertAIBlock: (attrs?: Partial<AIBlockAttrs>) => ({ commands }) =>
        commands.insertContent({
          type: this.name,
          attrs: { status: 'loading', prompt: '', content: '', timestamp: Date.now(), ...attrs },
        }),
      updateAIBlock: (attrs: Partial<AIBlockAttrs>) => ({ commands }) =>
        commands.updateAttributes(this.name, attrs),
    }
  },
})
