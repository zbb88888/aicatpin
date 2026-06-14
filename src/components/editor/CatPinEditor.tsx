import { useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { common, createLowlight } from 'lowlight'
import { cn } from '@/lib/utils'

// 导入自定义扩展
import { AIBlock } from './extensions/AIBlock'

// 创建 lowlight 实例
const lowlight = createLowlight(common)

// CatPinEditor 属性接口
export interface CatPinEditorProps {
  /** 初始内容 */
  content?: string
  /** 内容变化回调 */
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
}

// CatPinEditor 组件
export function CatPinEditor({
  content = '',
  onChange,
  placeholder = '开始记录你的思维碎片...',
  autoFocus = true,
  editable = true,
  className,
  height = '100%',
}: CatPinEditorProps) {
  // 创建编辑器
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        heading: {
          levels: [1, 2, 3],
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
      AIBlock,
    ],
    content,
    editable,
    autofocus: autoFocus,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      onChange?.(html)
    },
    editorProps: {
      attributes: {
        class: 'focus:outline-none',
      },
    },
  })

  // 保存快捷键
  useEffect(() => {
    if (!editor) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 's') {
        event.preventDefault()
        // 触发保存事件，由父组件处理
        const saveEvent = new CustomEvent('editor-save', { 
          detail: { content: editor.getHTML() } 
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
        <div className="text-zinc-600 text-sm">加载编辑器...</div>
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
            'prose prose-sm prose-invert max-w-none',
            'prose-headings:text-zinc-200 prose-headings:font-semibold',
            'prose-p:text-zinc-300 prose-p:leading-relaxed',
            'prose-strong:text-zinc-200 prose-strong:font-semibold',
            'prose-em:text-zinc-400',
            'prose-code:text-cyan-300 prose-code:bg-zinc-800/50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none',
            'prose-pre:bg-zinc-900/50 prose-pre:border prose-pre:border-zinc-800/50',
            'prose-blockquote:border-zinc-700/50 prose-blockquote:text-zinc-400',
            'prose-ul:text-zinc-300 prose-ol:text-zinc-300',
            'prose-li:text-zinc-300',
            'prose-a:text-cyan-400 prose-a:no-underline hover:prose-a:underline',
            'prose-hr:border-zinc-800/50',
            'prose-img:rounded-lg prose-img:border prose-img:border-zinc-800/50',
            // 占位符样式
            '[&_.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]',
            '[&_.is-editor-empty:first-child::before]:text-zinc-600',
            '[&_.is-editor-empty:first-child::before]:float-left',
            '[&_.is-editor-empty:first-child::before]:h-0',
            '[&_.is-editor-empty:first-child::before]:pointer-events-none'
          )}
        />
      </div>
    </div>
  )
}

export default CatPinEditor