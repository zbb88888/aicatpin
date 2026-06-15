import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'

/**
 * AutoTitle 扩展
 * 让文档的第一行自动成为一级标题（H1）
 * 用户无需输入 # 符号
 */
export const AutoTitle = Extension.create({
  name: 'autoTitle',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('autoTitle'),
        appendTransaction: (_transactions, oldState, newState) => {
          // 仅在内容变化时处理
          if (oldState.doc.eq(newState.doc)) return null

          const { doc, tr } = newState
          const firstNode = doc.firstChild
          if (!firstNode) return null

          // 如果第一行已经是 H1，不需要处理
          if (firstNode.type.name === 'heading' && firstNode.attrs.level === 1) return null

          // 如果第一行是空段落，转换为 H1
          if (firstNode.type.name === 'paragraph') {
            const headingType = newState.schema.nodes.heading
            if (!headingType) return null

            const headingNode = headingType.create({ level: 1 }, firstNode.content, firstNode.marks)
            tr.replaceWith(0, firstNode.nodeSize, headingNode)
            return tr
          }

          return null
        },
      }),
    ]
  },
})
