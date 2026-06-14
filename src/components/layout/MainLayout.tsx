import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { CatPinEditor, type CatPinEditorRef } from '@/components/editor/CatPinEditor'
import { useCatPinSave } from '@/hooks/useCatPinSave'
import { GlobalBackground } from '@/components/Background'
import type { SaveStatus } from '@/types'
import { Sparkles, X, Search, Plus, Save, FileText, ArrowRight, Command } from 'lucide-react'

// 状态指示器
function StatusIndicator({ status, progress }: { status: SaveStatus; progress: string }) {
  const config = {
    idle: { color: 'text-mung-muted', dot: 'bg-mung-muted', text: '已同步' },
    extracting: { color: 'text-emerald-600', dot: 'bg-emerald-500 animate-pulse', text: 'AI 重构中...' },
    embedding: { color: 'text-emerald-600', dot: 'bg-emerald-500 animate-pulse', text: '向量计算中...' },
    saving: { color: 'text-emerald-600', dot: 'bg-emerald-500 animate-pulse', text: '持久化中...' },
    syncing: { color: 'text-emerald-600', dot: 'bg-emerald-500 animate-pulse', text: '同步中...' },
    success: { color: 'text-emerald-700', dot: 'bg-emerald-600', text: '已保存' },
    error: { color: 'text-red-600', dot: 'bg-red-500', text: '保存失败' },
  }[status]

  return (
    <div className={cn('flex items-center gap-2 text-xs', config.color)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', config.dot)} />
      <span>{progress || config.text}</span>
    </div>
  )
}

// 命令项类型
interface CommandItem {
  id: string
  label: string
  description: string
  icon: React.ReactNode
  shortcut?: string
  action: () => void
}

// 命令面板
function CommandPalette({ isOpen, onClose, commands }: { 
  isOpen: boolean
  onClose: () => void
  commands: CommandItem[]
}) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const filtered = useMemo(() => 
    commands.filter(cmd => 
      cmd.label.toLowerCase().includes(query.toLowerCase()) ||
      cmd.description.toLowerCase().includes(query.toLowerCase())
    ), [commands, query])

  useEffect(() => { setSelectedIndex(0) }, [query])
  
  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 100)
    else setQuery('')
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex(prev => prev > 0 ? prev - 1 : filtered.length - 1)
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex(prev => prev < filtered.length - 1 ? prev + 1 : 0)
      } else if (e.key === 'Enter' && filtered[selectedIndex]) {
        filtered[selectedIndex].action()
        onClose()
      } else if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, filtered, selectedIndex, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-mung-surface border border-mung-border rounded-xl shadow-xl overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-mung-border">
          <Command className="w-4 h-4 text-mung-muted" />
          <input
            ref={inputRef}
            type="text"
            placeholder="搜索命令..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-mung-text placeholder-mung-muted focus:outline-none"
          />
          <kbd className="px-1.5 py-0.5 text-[10px] text-mung-muted bg-mung-border/30 rounded">ESC</kbd>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-mung-muted">无匹配命令</div>
          ) : (
            filtered.map((cmd, i) => (
              <div
                key={cmd.id}
                onClick={() => { cmd.action(); onClose() }}
                className={cn(
                  'px-4 py-2.5 flex items-center gap-3 cursor-pointer transition-colors',
                  i === selectedIndex ? 'bg-mung-hover' : 'hover:bg-mung-hover/50'
                )}
              >
                <div className="w-8 h-8 rounded-lg bg-mung-border/20 flex items-center justify-center">
                  {cmd.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-mung-text">{cmd.label}</div>
                  <div className="text-xs text-mung-muted truncate">{cmd.description}</div>
                </div>
                {cmd.shortcut && (
                  <kbd className="px-2 py-1 text-[10px] text-mung-muted bg-mung-border/30 rounded">
                    {cmd.shortcut}
                  </kbd>
                )}
              </div>
            ))
          )}
        </div>
        <div className="px-4 py-2 border-t border-mung-border flex items-center gap-4 text-[10px] text-mung-muted">
          <span><kbd className="px-1 py-0.5 bg-mung-border/30 rounded">↑↓</kbd> 导航</span>
          <span><kbd className="px-1 py-0.5 bg-mung-border/30 rounded">Enter</kbd> 选择</span>
          <span><kbd className="px-1 py-0.5 bg-mung-border/30 rounded">Esc</kbd> 关闭</span>
        </div>
      </div>
    </div>
  )
}

// AI 面板
function AIPanel({ isOpen, onClose, status, progress }: { 
  isOpen: boolean
  onClose: () => void
  status: SaveStatus
  progress: string
}) {
  if (!isOpen) return null

  return (
    <aside className="w-72 h-full border-l border-mung-border bg-mung-surface/50 flex flex-col">
      <div className="p-3 flex items-center justify-between border-b border-mung-border">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span className="text-xs font-medium text-mung-text">AI 协作</span>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-mung-hover rounded">
          <X className="w-3.5 h-3.5 text-mung-muted" />
        </button>
      </div>
      <div className="flex-1 p-3 overflow-y-auto">
        <div className="p-3 rounded-lg bg-mung-base border border-mung-border">
          <StatusIndicator status={status} progress={progress} />
        </div>
      </div>
    </aside>
  )
}

// 主布局
export function MainLayout() {
  const [commandOpen, setCommandOpen] = useState(false)
  const [aiOpen, setAiOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const editorRef = useRef<CatPinEditorRef>(null)
  const titleRef = useRef<HTMLInputElement>(null)
  const { status, progress } = useCatPinSave()

  const focusTitle = useCallback(() => titleRef.current?.focus(), [])

  const commands: CommandItem[] = useMemo(() => [
    {
      id: 'new', label: '新建笔记', description: '创建空白笔记',
      icon: <Plus className="w-4 h-4 text-mung-muted" />, shortcut: 'Ctrl+N',
      action: () => { setTitle(''); setContent(''); setTimeout(() => editorRef.current?.focus(), 100) }
    },
    {
      id: 'save', label: '保存笔记', description: '保存到数据库',
      icon: <Save className="w-4 h-4 text-mung-muted" />, shortcut: 'Ctrl+S',
      action: () => window.dispatchEvent(new CustomEvent('editor-save'))
    },
    {
      id: 'ai', label: 'AI 协作', description: '打开 AI 面板',
      icon: <Sparkles className="w-4 h-4 text-emerald-600" />, shortcut: 'Ctrl+Shift+A',
      action: () => setAiOpen(true)
    },
  ], [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setCommandOpen(prev => !prev) }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'A') { e.preventDefault(); setAiOpen(prev => !prev) }
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') { e.preventDefault(); setTitle(''); setContent(''); setTimeout(() => editorRef.current?.focus(), 100) }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleTitleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === 'ArrowDown') { e.preventDefault(); editorRef.current?.focus('start') }
  }, [])

  const wordCount = content.replace(/<[^>]*>/g, '').length
  const charCount = content.replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean).length

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
              <button onClick={() => setCommandOpen(true)} className="flex items-center gap-2 px-2 py-1 text-xs text-mung-muted hover:text-mung-text hover:bg-mung-hover rounded">
                <Search className="w-3 h-3" />
                <span>Ctrl+K</span>
              </button>
              <button onClick={() => setAiOpen(prev => !prev)} className={cn('p-1 rounded', aiOpen ? 'bg-mung-hover text-mung-text' : 'hover:bg-mung-hover/50')}>
                <Sparkles className="w-3.5 h-3.5" />
              </button>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto">
            <div className="max-w-2xl mx-auto px-8 py-12">
              <input
                ref={titleRef}
                type="text"
                placeholder="请输入主题"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={handleTitleKeyDown}
                className="w-full text-4xl font-extrabold tracking-tight leading-tight bg-transparent text-mung-text placeholder-mung-muted/50 focus:outline-none border-none mb-6 pb-4 border-b border-mung-border"
              />
              <CatPinEditor
                ref={editorRef}
                content={content}
                onChange={setContent}
                placeholder="开始记录..."
                height="auto"
                className="border-0 bg-transparent"
                onArrowUpAtTop={focusTitle}
              />
            </div>
          </div>

          <footer className="h-8 px-6 border-t border-mung-border flex items-center justify-between text-[11px] text-mung-muted">
            <div className="flex items-center gap-3">
              <span>字数: {wordCount}</span>
              <span className="text-mung-border">·</span>
              <span>词数: {charCount}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-mung-muted/70">Ctrl+S 保存</span>
              <StatusIndicator status={status} progress={progress} />
            </div>
          </footer>
        </main>

        <CommandPalette isOpen={commandOpen} onClose={() => setCommandOpen(false)} commands={commands} />
        <AIPanel isOpen={aiOpen} onClose={() => setAiOpen(false)} status={status} progress={progress} />
      </div>
    </GlobalBackground>
  )
}

export default MainLayout
