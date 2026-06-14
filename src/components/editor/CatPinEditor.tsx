import { useEffect, useCallback, forwardRef, useImperativeHandle } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { common, createLowlight } from 'lowlight'
import { Markdown } from 'tiptap-markdown'
import { cn } from '@/lib/utils'
import type { Editor } from '@tiptap/react'
import { AIBlock } from './extensions/AIBlock'

const lowlight = createLowlight(common)

export interface CatPinEditorRef {
  getEditor: () => Editor | null
  focus: (position?: 'start' | 'end' | number | boolean) => void
  getMarkdown: () => string
}

interface CatPinEditorProps {
  content?: string
  onChange?: (content: string) => void
  placeholder?: string
  autoFocus?: boolean
  editable?: boolean
  className?: string
  height?: string | number
  onArrowUpAtTop?: () => void
}

export const CatPinEditor = forwardRef<CatPinEditorRef, CatPinEditorProps>(function CatPinEditor({
  content = '', onChange, placeholder = '开始记录...', autoFocus = true, editable = true,
  className, height = '100%', onArrowUpAtTop,
}, ref) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      Placeholder.configure({ placeholder, emptyEditorClass: 'is-editor-empty' }),
      CodeBlockLowlight.configure({ lowlight, defaultLanguage: 'javascript' }),
      Markdown.configure({ html: false, transformPastedText: true, transformCopiedText: false }),
      AIBlock,
    ],
    content, editable, autofocus: autoFocus,
    onUpdate: ({ editor }) => onChange?.(editor.storage.markdown.getMarkdown()),
    editorProps: { attributes: { class: 'focus:outline-none' } },
  })

  const isCursorAtTop = useCallback(() => {
    if (!editor) return false
    const { from } = editor.state.selection
    const firstBlock = editor.state.doc.firstChild
    return !firstBlock || from <= 2
  }, [editor])

  useImperativeHandle(ref, () => ({
    getEditor: () => editor,
    focus: (position = 'start') => editor?.chain().focus(position).run(),
    getMarkdown: () => editor?.storage.markdown.getMarkdown() ?? '',
  }), [editor])

  useEffect(() => {
    if (!editor || !onArrowUpAtTop) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' && isCursorAtTop()) { e.preventDefault(); onArrowUpAtTop() }
    }
    editor.view.dom.addEventListener('keydown', handler)
    return () => editor.view.dom.removeEventListener('keydown', handler)
  }, [editor, onArrowUpAtTop, isCursorAtTop])

  useEffect(() => {
    if (!editor) return
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        window.dispatchEvent(new CustomEvent('editor-save', { detail: { content: editor.storage.markdown.getMarkdown() } }))
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [editor])

  if (!editor) return <div className="flex items-center justify-center h-32 text-mung-muted text-sm">加载中...</div>

  return (
    <div className={cn('flex flex-col', className)} style={{ height }}>
      <div className="flex-1 overflow-y-auto">
        <EditorContent editor={editor} className={cn(
          'prose max-w-none',
          '[&_h1]:text-4xl [&_h1]:font-extrabold [&_h1]:tracking-tight [&_h1]:text-mung-text [&_h1]:mb-8',
          '[&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:text-mung-text [&_h2]:mt-10 [&_h2]:pb-2 [&_h2]:border-b [&_h2]:border-mung-border',
          '[&_h3]:text-xl [&_h3]:text-mung-text [&_h3]:mt-8 [&_h3]:mb-4',
          '[&_p]:text-mung-text [&_p]:leading-relaxed [&_p]:mb-6',
          '[&_strong]:text-[#1A261B] [&_strong]:font-bold',
          '[&_em]:text-mung-muted',
          '[&_code]:text-emerald-700 [&_code]:bg-mung-border/30 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm [&_code]:before:content-none [&_code]:after:content-none',
          '[&_pre]:bg-mung-border/20 [&_pre]:border [&_pre]:border-mung-border [&_pre]:rounded-lg [&_pre]:p-4 [&_pre_code]:bg-transparent [&_pre_code]:text-mung-text',
          '[&_blockquote]:border-l-2 [&_blockquote]:border-mung-border [&_blockquote]:pl-4 [&_blockquote]:text-mung-muted [&_blockquote]:italic',
          '[&_ul]:text-mung-text [&_ol]:text-mung-text [&_li]:text-mung-text [&_li]:mb-1',
          '[&_a]:text-emerald-700 [&_a]:no-underline hover:[&_a]:underline',
          '[&_hr]:border-mung-border [&_hr]:my-8',
          '[&_.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.is-editor-empty:first-child::before]:text-mung-muted [&_.is-editor-empty:first-child::before]:float-left [&_.is-editor-empty:first-child::before]:h-0 [&_.is-editor-empty:first-child::before]:pointer-events-none',
        )} />
      </div>
    </div>
  )
})

export default CatPinEditor
