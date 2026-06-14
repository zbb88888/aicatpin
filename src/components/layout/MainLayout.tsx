import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { CatPinEditor, type CatPinEditorRef } from '@/components/editor/CatPinEditor'
import { useCatPinSave } from '@/hooks/useCatPinSave'
import { GlobalBackground } from '@/components/Background'
import type { SaveStatus } from '@/types'
import { Sparkles, X, Search, Plus, Save, Command } from 'lucide-react'

function StatusIndicator({ status, progress }: { status: SaveStatus; progress: string }) {
  const cfg = {
    idle: { color: 'text-mung-muted', dot: 'bg-mung-muted', text: '已同步' },
    extracting: { color: 'text-emerald-600', dot: 'bg-emerald-500 animate-pulse', text: 'AI 重构中...' },
    embedding: { color: 'text-emerald-600', dot: 'bg-emerald-500 animate-pulse', text: '向量计算中...' },
    saving: { color: 'text-emerald-600', dot: 'bg-emerald-500 animate-pulse', text: '保存中...' },
    syncing: { color: 'text-emerald-600', dot: 'bg-emerald-500 animate-pulse', text: '同步中...' },
    success: { color: 'text-emerald-700', dot: 'bg-emerald-600', text: '已保存' },
    error: { color: 'text-red-600', dot: 'bg-red-500', text: '失败' },
  }[status]

  return (
    <div className={cn('flex items-center gap-2 text-xs', cfg.color)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', cfg.dot)} />
      <span>{progress || cfg.text}</span>
    </div>
  )
}

interface CommandItem {
  id: string
  label: string
  description: string
  icon: React.ReactNode
  shortcut?: string
  action: () => void
}

function CommandPalette({ isOpen, onClose, commands }: { isOpen: boolean; onClose: () => void; commands: CommandItem[] }) {
  const [query, setQuery] = useState('')
  const [idx, setIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const filtered = useMemo(() =>
    commands.filter(c => c.label.toLowerCase().includes(query.toLowerCase()) || c.description.toLowerCase().includes(query.toLowerCase())),
    [commands, query])

  useEffect(() => { setIdx(0) }, [query])
  useEffect(() => { isOpen ? setTimeout(() => inputRef.current?.focus(), 100) : setQuery('') }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') { e.preventDefault(); setIdx(i => i > 0 ? i - 1 : filtered.length - 1) }
      else if (e.key === 'ArrowDown') { e.preventDefault(); setIdx(i => i < filtered.length - 1 ? i + 1 : 0) }
      else if (e.key === 'Enter' && filtered[idx]) { filtered[idx].action(); onClose() }
      else if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, filtered, idx, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-mung-surface border border-mung-border rounded-xl shadow-xl overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-mung-border">
          <Command className="w-4 h-4 text-mung-muted" />
          <input ref={inputRef} type="text" placeholder="搜索命令..." value={query} onChange={e => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-mung-text placeholder-mung-muted focus:outline-none" />
          <kbd className="px-1.5 py-0.5 text-[10px] text-mung-muted bg-mung-border/30 rounded">ESC</kbd>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-mung-muted">无匹配命令</div>
          ) : filtered.map((cmd, i) => (
            <div key={cmd.id} onClick={() => { cmd.action(); onClose() }}
              className={cn('px-4 py-2.5 flex items-center gap-3 cursor-pointer', i === idx ? 'bg-mung-hover' : 'hover:bg-mung-hover/50')}>
              <div className="w-8 h-8 rounded-lg bg-mung-border/20 flex items-center justify-center">{cmd.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-mung-text">{cmd.label}</div>
                <div className="text-xs text-mung-muted truncate">{cmd.description}</div>
              </div>
              {cmd.shortcut && <kbd className="px-2 py-1 text-[10px] text-mung-muted bg-mung-border/30 rounded">{cmd.shortcut}</kbd>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function AIPanel({ isOpen, onClose, status, progress }: { isOpen: boolean; onClose: () => void; status: SaveStatus; progress: string }) {
  if (!isOpen) return null
  return (
    <aside className="w-72 h-full border-l border-mung-border bg-mung-surface/50 flex flex-col">
      <div className="p-3 flex items-center justify-between border-b border-mung-border">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span className="text-xs font-medium text-mung-text">AI 协作</span>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-mung-hover rounded"><X className="w-3.5 h-3.5 text-mung-muted" /></button>
      </div>
      <div className="flex-1 p-3 overflow-y-auto">
        <div className="p-3 rounded-lg bg-mung-base border border-mung-border">
          <StatusIndicator status={status} progress={progress} />
        </div>
      </div>
    </aside>
  )
}

export function MainLayout() {
  const [cmdOpen, setCmdOpen] = useState(false)
  const [aiOpen, setAiOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const editorRef = useRef<CatPinEditorRef>(null)
  const titleRef = useRef<HTMLInputElement>(null)
  const { status, progress } = useCatPinSave()

  const focusTitle = useCallback(() => titleRef.current?.focus(), [])
  const resetEditor = useCallback(() => { setTitle(''); setContent(''); setTimeout(() => editorRef.current?.focus(), 100) }, [])

  const commands: CommandItem[] = useMemo(() => [
    { id: 'new', label: '新建笔记', description: '创建空白笔记', icon: <Plus className="w-4 h-4 text-mung-muted" />, shortcut: 'Ctrl+N', action: resetEditor },
    { id: 'save', label: '保存笔记', description: '保存到数据库', icon: <Save className="w-4 h-4 text-mung-muted" />, shortcut: 'Ctrl+S', action: () => window.dispatchEvent(new CustomEvent('editor-save')) },
    { id: 'ai', label: 'AI 协作', description: '打开 AI 面板', icon: <Sparkles className="w-4 h-4 text-emerald-600" />, shortcut: 'Ctrl+Shift+A', action: () => setAiOpen(true) },
  ], [resetEditor])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setCmdOpen(p => !p) }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'A') { e.preventDefault(); setAiOpen(p => !p) }
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') { e.preventDefault(); resetEditor() }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [resetEditor])

  const handleTitleKey = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === 'ArrowDown') { e.preventDefault(); editorRef.current?.focus('start') }
  }, [])

  const text = content.replace(/<[^>]*>/g, '')

  return (
    <GlobalBackground>
      <div className="flex h-screen w-screen">
        <main className="flex-1 flex flex-col h-full bg-mung-base min-w-0">
          <header className="h-10 border-b border-mung-border flex items-center justify-between px-6 text-xs text-mung-muted">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded bg-mung-border/30 flex items-center justify-center">
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                </div>
                <span className="text-xs font-medium text-mung-text tracking-wider">AICATPIN</span>
              </div>
              <span className="text-mung-border">/</span>
              <span className="text-mung-muted italic">未分类</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span>gemma4:e2b</span>
              </div>
              <button onClick={() => setCmdOpen(true)} className="flex items-center gap-2 px-2 py-1 text-xs text-mung-muted hover:text-mung-text hover:bg-mung-hover rounded">
                <Search className="w-3 h-3" /><span>Ctrl+K</span>
              </button>
              <button onClick={() => setAiOpen(p => !p)} className={cn('p-1 rounded', aiOpen ? 'bg-mung-hover text-mung-text' : 'hover:bg-mung-hover/50')}>
                <Sparkles className="w-3.5 h-3.5" />
              </button>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto">
            <div className="max-w-2xl mx-auto px-8 py-12">
              <input ref={titleRef} type="text" placeholder="请输入主题" value={title} onChange={e => setTitle(e.target.value)} onKeyDown={handleTitleKey}
                className="w-full text-4xl font-extrabold tracking-tight leading-tight bg-transparent text-mung-text placeholder-mung-muted/50 focus:outline-none border-none mb-6 pb-4 border-b border-mung-border" />
              <CatPinEditor ref={editorRef} content={content} onChange={setContent} placeholder="开始记录..." height="auto" className="border-0 bg-transparent" onArrowUpAtTop={focusTitle} />
            </div>
          </div>

          <footer className="h-8 px-6 border-t border-mung-border flex items-center justify-between text-[11px] text-mung-muted">
            <div className="flex items-center gap-3">
              <span>字数: {text.length}</span>
              <span className="text-mung-border">·</span>
              <span>词数: {text.split(/\s+/).filter(Boolean).length}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-mung-muted/70">Ctrl+S 保存</span>
              <StatusIndicator status={status} progress={progress} />
            </div>
          </footer>
        </main>

        <CommandPalette isOpen={cmdOpen} onClose={() => setCmdOpen(false)} commands={commands} />
        <AIPanel isOpen={aiOpen} onClose={() => setAiOpen(false)} status={status} progress={progress} />
      </div>
    </GlobalBackground>
  )
}

export default MainLayout
