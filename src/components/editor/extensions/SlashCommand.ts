import { Extension, Range } from '@tiptap/core'
import { Editor } from '@tiptap/react'
import Suggestion from '@tiptap/suggestion'

// Slash Command 选项类型
export interface SlashCommandOption {
  title: string
  description: string
  icon: string
  command: (props: { editor: Editor; range: Range }) => void
}

// Slash Command 扩展配置
export interface SlashCommandOptions {
  suggestion: {
    char: string
    allowSpaces: boolean
    startOfLine: boolean
    command: (props: { editor: Editor; range: Range; props: SlashCommandOption }) => void
  }
}

// 创建 Slash Command 扩展
export const SlashCommand = Extension.create<SlashCommandOptions>({
  name: 'slashCommand',

  addOptions() {
    return {
      suggestion: {
        char: '/',
        allowSpaces: false,
        startOfLine: false,
        command: ({ editor, range, props }) => {
          props.command({ editor, range })
        },
      },
    }
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ]
  },
})

// Slash Command 菜单项定义
export const slashCommandItems: SlashCommandOption[] = [
  {
    title: '文本',
    description: '普通文本段落',
    icon: '¶',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).run()
    },
  },
  {
    title: '标题 1',
    description: '大标题',
    icon: 'H1',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleHeading({ level: 1 }).run()
    },
  },
  {
    title: '标题 2',
    description: '中标题',
    icon: 'H2',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleHeading({ level: 2 }).run()
    },
  },
  {
    title: '标题 3',
    description: '小标题',
    icon: 'H3',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleHeading({ level: 3 }).run()
    },
  },
  {
    title: '无序列表',
    description: '创建无序列表',
    icon: '•',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBulletList().run()
    },
  },
  {
    title: '有序列表',
    description: '创建有序列表',
    icon: '1.',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleOrderedList().run()
    },
  },
  {
    title: '引用',
    description: '创建引用块',
    icon: '❝',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBlockquote().run()
    },
  },
  {
    title: '代码块',
    description: '创建代码块',
    icon: '⟨⟩',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleCodeBlock().run()
    },
  },
  {
    title: '分割线',
    description: '插入分割线',
    icon: '—',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHorizontalRule().run()
    },
  },
  {
    title: 'AI 助手',
    description: '使用 AI 生成内容',
    icon: '🤖',
    command: ({ editor, range }) => {
      // 删除斜杠命令文本
      editor.chain().focus().deleteRange(range).run()
      
      // 插入 AI 块
      editor.chain().focus().insertContent({
        type: 'aiBlock',
        attrs: {
          status: 'loading',
          prompt: '',
          content: '',
        },
      }).run()
    },
  },
]

// 获取过滤后的命令列表
export function getFilteredCommands(
  query: string,
  commands: SlashCommandOption[]
): SlashCommandOption[] {
  return commands.filter((item) => {
    const search = query.toLowerCase()
    return (
      item.title.toLowerCase().includes(search) ||
      item.description.toLowerCase().includes(search)
    )
  })
}