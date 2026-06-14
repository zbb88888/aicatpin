import { Node, mergeAttributes } from '@tiptap/core'

export type AIBlockStatus = 'idle' | 'loading' | 'streaming' | 'complete' | 'error'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    aiBlock: {
      insertAIBlock: (attrs?: { status?: AIBlockStatus; prompt?: string; content?: string }) => ReturnType
      updateAIBlock: (attrs: { status?: AIBlockStatus; prompt?: string; content?: string }) => ReturnType
    }
  }
}

export const AIBlock = Node.create({
  name: 'aiBlock',
  group: 'block',
  content: 'inline*',
  defining: true,
  addAttributes: () => ({
    status: { default: 'idle' },
    prompt: { default: '' },
    content: { default: '' },
    timestamp: { default: null },
  }),
  parseHTML: () => [{ tag: 'div[data-type="ai-block"]' }],
  renderHTML: ({ HTMLAttributes }) => ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'ai-block' }), 0],
  addCommands: () => ({
    insertAIBlock: (attrs) => ({ commands }) =>
      commands.insertContent({ type: 'aiBlock', attrs: { status: 'loading', prompt: '', content: '', timestamp: Date.now(), ...attrs } }),
    updateAIBlock: (attrs) => ({ commands }) =>
      commands.updateAttributes('aiBlock', attrs),
  }),
})
