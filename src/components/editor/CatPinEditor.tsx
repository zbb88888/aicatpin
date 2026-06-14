import React, { useCallback, useEffect, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { common, createLowlight } from 'lowlight'
import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { 
  Bold, 
  Italic, 
  Strikethrough, 
  Code, 
  Heading1, 
  Heading2, 
  Heading3,
  List, 
  ListOrdered, 
  Quote, 
  Minus,
  Undo,
  Redo,
  Save,
  Sparkles
} from 'lucide-react'

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
  /** 保存回调 */
  onSave?: (content: string) => void
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
  /** 是否显示工具栏 */
  showToolbar?: boolean
  /** 是否显示字数统计 */
  showWordCount?: boolean
}

// 工具栏按钮组件
function ToolbarButton({
  onClick,
  isActive,
  disabled,
  children,
  title,
}: {
  onClick: () => void
  isActive?: boolean
  disabled?: boolean
  children: React.ReactNode
  title: string
}) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn(
        'h-8 w-8',
        isActive
          ? 'bg-cyan-500/20 text-cyan-400'
          : 'text-cyan-400/60 hover:text-cyan-400 hover:bg-cyan-500/10'
      )}
      onClick={onClick}
      disabled={disabled}
      title={title}
    >
      {children}
    </Button>
  )
}

// 工具栏分隔符
function ToolbarSeparator() {
  return <div className="w-px h-6 bg-cyan-500/20 mx-1" />
}

// CatPinEditor 组件
export function CatPinEditor({
  content = '',
  onChange,
  onSave,
  placeholder = '开始输入，或按 "/" 打开命令菜单...',
  autoFocus = true,
  editable = true,
  className,
  height = '100%',
  showToolbar = true,
  showWordCount = true,
}: CatPinEditorProps) {
  const [wordCount, setWordCount] = useState(0)
  const [charCount, setCharCount] = useState(0)
  const [isSaved, setIsSaved] = useState(true)

  // 创建编辑器
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false, // 使用 CodeBlockLowlight 替代
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
      const text = editor.getText()
      
      // 更新字数统计
      setWordCount(text.split(/\s+/).filter(Boolean).length)
      setCharCount(text.length)
      setIsSaved(false)
      
      // 触发变化回调
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
        handleSave()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [editor])

  // 处理保存
  const handleSave = useCallback(() => {
    if (!editor) return
    const content = editor.getHTML()
    onSave?.(content)
    setIsSaved(true)
  }, [editor, onSave])

  // 工具栏操作
  const toggleBold = useCallback(() => editor?.chain().focus().toggleBold().run(), [editor])
  const toggleItalic = useCallback(() => editor?.chain().focus().toggleItalic().run(), [editor])
  const toggleStrike = useCallback(() => editor?.chain().focus().toggleStrike().run(), [editor])
  const toggleCode = useCallback(() => editor?.chain().focus().toggleCode().run(), [editor])
  const toggleHeading1 = useCallback(() => editor?.chain().focus().toggleHeading({ level: 1 }).run(), [editor])
  const toggleHeading2 = useCallback(() => editor?.chain().focus().toggleHeading({ level: 2 }).run(), [editor])
  const toggleHeading3 = useCallback(() => editor?.chain().focus().toggleHeading({ level: 3 }).run(), [editor])
  const toggleBulletList = useCallback(() => editor?.chain().focus().toggleBulletList().run(), [editor])
  const toggleOrderedList = useCallback(() => editor?.chain().focus().toggleOrderedList().run(), [editor])
  const toggleBlockquote = useCallback(() => editor?.chain().focus().toggleBlockquote().run(), [editor])
  const toggleCodeBlock = useCallback(() => editor?.chain().focus().toggleCodeBlock().run(), [editor])
  const setHorizontalRule = useCallback(() => editor?.chain().focus().setHorizontalRule().run(), [editor])
  const undo = useCallback(() => editor?.chain().focus().undo().run(), [editor])
  const redo = useCallback(() => editor?.chain().focus().redo().run(), [editor])
  const insertAIBlock = useCallback(() => editor?.chain().focus().insertAIBlock().run(), [editor])

  // 如果编辑器未初始化
  if (!editor) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-cyan-400/40">加载编辑器中...</div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'flex flex-col border border-cyan-500/20 rounded-lg bg-card/50 backdrop-blur-sm',
        className
      )}
      style={{ height }}
    >
      {/* 工具栏 */}
      {showToolbar && (
        <div className="flex items-center justify-between px-3 py-2 border-b border-cyan-500/20">
          <div className="flex items-center gap-1">
            <ToolbarButton
              onClick={toggleBold}
              isActive={editor.isActive('bold')}
              title="粗体 (Ctrl+B)"
            >
              <Bold className="w-4 h-4" />
            </ToolbarButton>
            
            <ToolbarButton
              onClick={toggleItalic}
              isActive={editor.isActive('italic')}
              title="斜体 (Ctrl+I)"
            >
              <Italic className="w-4 h-4" />
            </ToolbarButton>
            
            <ToolbarButton
              onClick={toggleStrike}
              isActive={editor.isActive('strike')}
              title="删除线"
            >
              <Strikethrough className="w-4 h-4" />
            </ToolbarButton>
            
            <ToolbarButton
              onClick={toggleCode}
              isActive={editor.isActive('code')}
              title="行内代码"
            >
              <Code className="w-4 h-4" />
            </ToolbarButton>
            
            <ToolbarSeparator />
            
            <ToolbarButton
              onClick={toggleHeading1}
              isActive={editor.isActive('heading', { level: 1 })}
              title="标题 1"
            >
              <Heading1 className="w-4 h-4" />
            </ToolbarButton>
            
            <ToolbarButton
              onClick={toggleHeading2}
              isActive={editor.isActive('heading', { level: 2 })}
              title="标题 2"
            >
              <Heading2 className="w-4 h-4" />
            </ToolbarButton>
            
            <ToolbarButton
              onClick={toggleHeading3}
              isActive={editor.isActive('heading', { level: 3 })}
              title="标题 3"
            >
              <Heading3 className="w-4 h-4" />
            </ToolbarButton>
            
            <ToolbarSeparator />
            
            <ToolbarButton
              onClick={toggleBulletList}
              isActive={editor.isActive('bulletList')}
              title="无序列表"
            >
              <List className="w-4 h-4" />
            </ToolbarButton>
            
            <ToolbarButton
              onClick={toggleOrderedList}
              isActive={editor.isActive('orderedList')}
              title="有序列表"
            >
              <ListOrdered className="w-4 h-4" />
            </ToolbarButton>
            
            <ToolbarButton
              onClick={toggleBlockquote}
              isActive={editor.isActive('blockquote')}
              title="引用"
            >
              <Quote className="w-4 h-4" />
            </ToolbarButton>
            
            <ToolbarButton
              onClick={toggleCodeBlock}
              isActive={editor.isActive('codeBlock')}
              title="代码块"
            >
              <Code className="w-4 h-4" />
            </ToolbarButton>
            
            <ToolbarButton
              onClick={setHorizontalRule}
              title="分割线"
            >
              <Minus className="w-4 h-4" />
            </ToolbarButton>
            
            <ToolbarSeparator />
            
            <ToolbarButton
              onClick={undo}
              disabled={!editor.can().undo()}
              title="撤销 (Ctrl+Z)"
            >
              <Undo className="w-4 h-4" />
            </ToolbarButton>
            
            <ToolbarButton
              onClick={redo}
              disabled={!editor.can().redo()}
              title="重做 (Ctrl+Shift+Z)"
            >
              <Redo className="w-4 h-4" />
            </ToolbarButton>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={insertAIBlock}
              className="text-cyan-400/60 hover:text-cyan-400"
              title="插入 AI 块 (Ctrl+Shift+A)"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              AI
            </Button>
            
            <Button
              variant="cyber"
              size="sm"
              onClick={handleSave}
              disabled={isSaved}
              title="保存 (Ctrl+S)"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaved ? '已保存' : '保存'}
            </Button>
          </div>
        </div>
      )}

      {/* 编辑器内容 */}
      <ScrollArea className="flex-1">
        <div className="p-6 max-w-4xl mx-auto">
          <EditorContent
            editor={editor}
            className={cn(
              'prose prose-sm prose-invert max-w-none',
              'prose-headings:text-cyan-400 prose-headings:font-semibold',
              'prose-p:text-foreground/80 prose-p:leading-relaxed',
              'prose-strong:text-cyan-400 prose-strong:font-semibold',
              'prose-em:text-foreground/70',
              'prose-code:text-cyan-300 prose-code:bg-cyan-500/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none',
              'prose-pre:bg-background/80 prose-pre:border prose-pre:border-cyan-500/10',
              'prose-blockquote:border-cyan-500/30 prose-blockquote:text-foreground/70',
              'prose-ul:text-foreground/80 prose-ol:text-foreground/80',
              'prose-li:text-foreground/80',
              'prose-a:text-cyan-400 prose-a:no-underline hover:prose-a:underline',
              'prose-hr:border-cyan-500/20',
              'prose-img:rounded-lg prose-img:border prose-img:border-cyan-500/20',
              // 占位符样式
              '[&_.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]',
              '[&_.is-editor-empty:first-child::before]:text-cyan-400/30',
              '[&_.is-editor-empty:first-child::before]:float-left',
              '[&_.is-editor-empty:first-child::before]:h-0',
              '[&_.is-editor-empty:first-child::before]:pointer-events-none'
            )}
          />
        </div>
      </ScrollArea>

      {/* 底部状态栏 */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-cyan-500/20">
        <div className="flex items-center gap-4 text-xs text-cyan-400/40">
          {showWordCount && (
            <>
              <span>字数: {charCount}</span>
              <span>词数: {wordCount}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-cyan-400/40">
          <span>按 Ctrl+S 保存</span>
          <span>•</span>
          <span>Ctrl+Shift+A 插入 AI 块</span>
        </div>
      </div>
    </div>
  )
}

export default CatPinEditor