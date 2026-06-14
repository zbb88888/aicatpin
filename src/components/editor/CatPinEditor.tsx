import { useEffect, useCallback, forwardRef, useImperativeHandle } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { common, createLowlight } from 'lowlight'
import { Markdown } from 'tiptap-markdown'
import { cn } from '@/lib/utils'
import type { Editor } from '@tiptap/react'

// 导入自定义扩展
import { AIBlock } from './extensions/AIBlock'

// 创建 lowlight 实例
const lowlight = createLowlight(common)

// CatPinEditor 引用接口
export interface CatPinEditorRef {
  /** 获取编辑器实例 */
  getEditor: () => Editor | null
  /** 聚焦编辑器 */
  focus: (position?: 'start' | 'end' | number | boolean) => void
  /** 获取 Markdown 内容 */
  getMarkdown: () => string
}

// CatPinEditor 属性接口
export interface CatPinEditorProps {
  /** 初始内容 (Markdown 格式) */
  content?: string
  /** 内容变化回调 (返回 Markdown 格式) */
  onChange?: (content: string) => void
  /** 占位符文本 */
  placeholder?: string
  /** 是否自动聚焦 */
  autoFocus?: boolean
  /** 是否只读 */
  editable?: boolean
  /** 自定义类名 */
  className?: string
  /** 编辑器高度 */
  height?: string | number
  /** 向上键到顶部时的回调 */
  onArrowUpAtTop?: () => void
  /** 编辑器引用 */
  ref?: React.Ref<CatPinEditorRef>
}

// CatPinEditor 组件
export const CatPinEditor = forwardRef<CatPinEditorRef, CatPinEditorProps>(function CatPinEditor({
  content = '',
  onChange,
  placeholder = '开始记录...',
  autoFocus = true,
  editable = true,
  className,
  height = '100%',
  onArrowUpAtTop,
}, ref) {

  // 创建编辑器
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: 'is-editor-empty',
      }),
      CodeBlockLowlight.configure({
        lowlight,
        defaultLanguage: 'javascript',
      }),
      Markdown.configure({
        html: false,           // 不解析 HTML
        transformPastedText: true,  // 粘贴时转换 Markdown
        transformCopiedText: false, // 复制时不转换
      }),
      AIBlock,
    ],
    content,
    editable,
    autofocus: autoFocus,
    onUpdate: ({ editor }) => {
      // 获取 Markdown 格式的内容
      const markdown = editor.storage.markdown.getMarkdown()
      onChange?.(markdown)
    },
    editorProps: {
      attributes: {
        class: 'focus:outline-none',
      },
    },
  })

  // 检测光标是否在顶部
  const isCursorAtTop = useCallback(() => {
    if (!editor) return false
    const { from } = editor.state.selection
    const doc = editor.state.doc
    // 检查光标是否在第一个块的开始位置
    const firstBlock = doc.firstChild
    if (!firstBlock) return true
    const firstBlockStart = 1 // 文档开始位置
    return from <= firstBlockStart + 1
  }, [editor])

  // 暴露方法给父组件
  useImperativeHandle(ref, () => ({
    getEditor: () => editor,
    focus: (position = 'start') => {
      if (editor) {
        editor.chain().focus(position).run()
      }
    },
    getMarkdown: () => {
      if (!editor) return ''
      return editor.storage.markdown.getMarkdown()
    },
  }), [editor])

  // 处理向上键跳转到标题
  useEffect(() => {
    if (!editor || !onArrowUpAtTop) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowUp' && isCursorAtTop()) {
        event.preventDefault()
        onArrowUpAtTop()
      }
    }

    const editorElement = editor.view.dom
    editorElement.addEventListener('keydown', handleKeyDown)
    return () => {
      editorElement.removeEventListener('keydown', handleKeyDown)
    }
  }, [editor, onArrowUpAtTop, isCursorAtTop])

  // 保存快捷键
  useEffect(() => {
    if (!editor) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 's') {
        event.preventDefault()
        // 获取 Markdown 内容并触发保存事件
        const markdown = editor.storage.markdown.getMarkdown()
        const saveEvent = new CustomEvent('editor-save', { 
          detail: { content: markdown } 
        })
        window.dispatchEvent(saveEvent)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [editor])

  // 如果编辑器未初始化
  if (!editor) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-mung-muted text-sm">加载编辑器...</div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'flex flex-col',
        className
      )}
      style={{ height }}
    >
      {/* 编辑器内容 */}
      <div className="flex-1 overflow-y-auto">
        <EditorContent
          editor={editor}
          className={cn(
            'prose max-w-none',
            // H1 主标题：极为醒目
            '[&_h1]:text-4xl [&_h1]:font-extrabold [&_h1]:tracking-tight [&_h1]:text-mung-text [&_h1]:mb-8',
            // H2 模块标题：强烈的视觉分块感
            '[&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:text-mung-text [&_h2]:mt-10 [&_h2]:pb-2 [&_h2]:border-b [&_h2]:border-mung-border',
            // H3 子标题
            '[&_h3]:text-xl [&_h3]:text-mung-text [&_h3]:mt-8 [&_h3]:mb-4',
            // H4-H6
            '[&_h4]:text-lg [&_h4]:font-medium [&_h4]:text-mung-text [&_h4]:mt-6 [&_h4]:mb-3',
            '[&_h5]:text-base [&_h5]:font-medium [&_h5]:text-mung-text [&_h5]:mt-4 [&_h5]:mb-2',
            '[&_h6]:text-sm [&_h6]:font-medium [&_h6]:text-mung-text [&_h6]:mt-4 [&_h6]:mb-2',
            // 正文段落：提升呼吸感
            '[&_p]:text-mung-text [&_p]:leading-relaxed [&_p]:mb-6',
            // 粗体：比正文更深一阶的墨色
            '[&_strong]:text-[#1A261B] [&_strong]:font-bold',
            // 斜体
            '[&_em]:text-mung-muted',
            // 内联代码
            '[&_code]:text-emerald-700 [&_code]:bg-mung-border/30 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm [&_code]:before:content-none [&_code]:after:content-none',
            // 代码块
            '[&_pre]:bg-mung-border/20 [&_pre]:border [&_pre]:border-mung-border [&_pre]:rounded-lg [&_pre]:p-4',
            '[&_pre_code]:bg-transparent [&_pre_code]:text-mung-text',
            // 引用
            '[&_blockquote]:border-l-2 [&_blockquote]:border-mung-border [&_blockquote]:pl-4 [&_blockquote]:text-mung-muted [&_blockquote]:italic',
            // 列表
            '[&_ul]:text-mung-text [&_ol]:text-mung-text',
            '[&_li]:text-mung-text [&_li]:mb-1',
            // 链接
            '[&_a]:text-emerald-700 [&_a]:no-underline hover:[&_a]:underline',
            // 分割线
            '[&_hr]:border-mung-border [&_hr]:my-8',
            // 图片
            '[&_img]:rounded-lg [&_img]:border [&_img]:border-mung-border',
            // 表格
            '[&_table]:border-collapse',
            '[&_th]:border [&_th]:border-mung-border [&_th]:px-3 [&_th]:py-2 [&_th]:bg-mung-border/20 [&_th]:text-mung-text [&_th]:font-medium',
            '[&_td]:border [&_td]:border-mung-border [&_td]:px-3 [&_td]:py-2',
            // 占位符样式
            '[&_.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]',
            '[&_.is-editor-empty:first-child::before]:text-mung-muted',
            '[&_.is-editor-empty:first-child::before]:float-left',
            '[&_.is-editor-empty:first-child::before]:h-0',
            '[&_.is-editor-empty:first-child::before]:pointer-events-none',
          )}
        />
      </div>
    </div>
  )
})

export default CatPinEditor