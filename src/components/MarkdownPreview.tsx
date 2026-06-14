import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import { markdownToHtml } from '@/lib/markdown'

interface MarkdownPreviewProps {
  content: string
  className?: string
}

export function MarkdownPreview({ content, className }: MarkdownPreviewProps) {
  const html = useMemo(() => markdownToHtml(content), [content])
  
  return (
    <div
      className={cn(
        'prose prose-sm prose-invert max-w-none',
        'prose-headings:text-zinc-200 prose-headings:font-semibold',
        'prose-p:text-zinc-300 prose-p:leading-relaxed',
        'prose-strong:text-zinc-200 prose-strong:font-semibold',
        'prose-em:text-zinc-400',
        'prose-code:text-cyan-300 prose-code:bg-zinc-800/50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded',
        'prose-pre:bg-zinc-900/50 prose-pre:border prose-pre:border-zinc-800/50 prose-pre:rounded-lg',
        'prose-blockquote:border-zinc-700/50 prose-blockquote:text-zinc-400',
        'prose-ul:text-zinc-300 prose-ol:text-zinc-300',
        'prose-li:text-zinc-300',
        'prose-a:text-cyan-400 prose-a:no-underline hover:prose-a:underline',
        'prose-hr:border-zinc-800/50',
        'prose-img:rounded-lg prose-img:border prose-img:border-zinc-800/50',
        'prose-table:border-collapse',
        'prose-th:border prose-th:border-zinc-800/50 prose-th:px-3 prose-th:py-2 prose-th:bg-zinc-900/50',
        'prose-td:border prose-td:border-zinc-800/50 prose-td:px-3 prose-td:py-2',
        className
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

export default MarkdownPreview