import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { CatPinEditor, type CatPinEditorRef } from '@/components/editor/CatPinEditor'
import { useLocalWorkspace } from '@/hooks/useLocalWorkspace'
import { useEditorMode } from '@/hooks/useEditorMode'
import { useCloudSync } from '@/hooks/useCloudSync'
import { GlobalBackground } from '@/components/Background'
import type { SaveStatus as LocalSaveStatus } from '@/hooks/useLocalWorkspace'
import type { SyncStatus } from '@/hooks/useCloudSync'
import type { CloudNote } from '@/hooks/useEditorMode'
import { Sparkles, Search, Plus, Save, Cloud, Edit3 } from 'lucide-react'

// 状态指示器
function StatusIndicator({ localStatus, syncStatus, progress }: { 
  localStatus: LocalSaveStatus
  syncStatus: SyncStatus
  progress: string 
}) {
  const cfg = {
    idle: { color: 'text-mung-muted', dot: 'bg-mung-muted', text: '' },
    saving: { color: 'text-mung-muted', dot: 'bg-mung-muted animate-pulse', text: '保存中...' },
    saved: { color: 'text-emerald-600', dot: 'bg-emerald-500', text: '○ 已暂存本地' },
    syncing: { color: 'text-emerald-600', dot: 'bg-emerald-500 animate-pulse', text: '同步中...' },
    extracting: { color: 'text-emerald-600', dot: 'bg-emerald-500 animate-pulse', text: 'AI 提炼中...' },
    embedding: { color: 'text-emerald-600', dot: 'bg-emerald-500 animate-pulse', text: '向量计算中...' },
    uploading: { color: 'text-emerald-600', dot: 'bg-emerald-500 animate-pulse', text: '同步入库中...' },
    cleaning: { color: 'text-emerald-600', dot: 'bg-emerald-500 animate-pulse', text: '清理中...' },
    done: { color: 'text-emerald-700', dot: 'bg-emerald-600', text: '✓ 已入库' },
    synced: { color: 'text-emerald-700', dot: 'bg-emerald-600', text: '✓ 已入库' },
    error: { color: 'text-red-600', dot: 'bg-red-500', text: '失败' },
  }

  // 优先显示同步状态
  const status = syncStatus !== 'idle' ? syncStatus : localStatus
  const current = cfg[status] || cfg.idle
  const displayText = progress || current.text

  if (!displayText) return null

  return (
    <div className={cn('flex items-center gap-2 text-xs transition-all', current.color)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', current.dot)} />
      <span>{displayText}</span>
    </div>
  )
}

// 命令项
interface CommandItem {
  id: string
  label: string
  description: string
  icon: React.ReactNode
  shortcut?: string
  action: () => void
}

// 命令面板
function CommandPalette({ isOpen, onClose, commands, notes, onNoteSelect }: { 
  isOpen: boolean
  onClose: () => void
  commands: CommandItem[]
  notes: CloudNote[]
  onNoteSelect: (note: CloudNote) => void
}) {
  const [query, setQuery] = useState('')
  const [idx, setIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const filtered = useMemo(() => {
    if (!query) return notes.map(n => ({ type: 'note' as const, item: n }))
    return commands
      .filter(c => c.label.toLowerCase().includes(query.toLowerCase()) || c.description.toLowerCase().includes(query.toLowerCase()))
      .map(c => ({ type: 'command' as const, item: c }))
  }, [commands, notes, query])

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => inputRef.current?.focus(), 100)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setIdx(i => i > 0 ? i - 1 : filtered.length - 1)
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        setIdx(i => i < filtered.length - 1 ? i + 1 : 0)
      } else if (e.key === 'Enter' && filtered[idx]) {
        if (filtered[idx].type === 'command') {
          (filtered[idx].item as CommandItem).action()
        } else {
          onNoteSelect(filtered[idx].item as CloudNote)
        }
        onClose()
      } else if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, filtered, idx, onClose, onNoteSelect])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-mung-surface border border-mung-border rounded-xl shadow-xl overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-mung-border">
          <Search className="w-4 h-4 text-mung-muted" />
          <input 
            ref={inputRef} 
            type="text" 
            placeholder="搜索云端笔记..." 
            value={query} 
            onChange={e => { setQuery(e.target.value); setIdx(0) }}
            className="flex-1 bg-transparent text-sm text-mung-text placeholder-mung-muted focus:outline-none" 
          />
          <kbd className="px-1.5 py-0.5 text-[10px] text-mung-muted bg-mung-border/30 rounded">ESC</kbd>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-mung-muted">无匹配结果</div>
          ) : filtered.map((item, i) => (
            <div 
              key={i} 
              onClick={() => {
                if (item.type === 'command') (item.item as CommandItem).action()
                else onNoteSelect(item.item as CloudNote)
                onClose()
              }}
              className={cn('px-4 py-2.5 flex items-center gap-3 cursor-pointer', i === idx ? 'bg-mung-hover' : 'hover:bg-mung-hover/50')}
            >
              {item.type === 'note' ? (
                <>
                  <div className="w-8 h-8 rounded-lg bg-mung-border/20 flex items-center justify-center">
                    <Cloud className="w-4 h-4 text-mung-muted" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-mung-text truncate">{(item.item as CloudNote).title}</div>
                    <div className="text-xs text-mung-muted truncate">{(item.item as CloudNote).category}</div>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-8 h-8 rounded-lg bg-mung-border/20 flex items-center justify-center">
                    {(item.item as CommandItem).icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-mung-text">{(item.item as CommandItem).label}</div>
                    <div className="text-xs text-mung-muted truncate">{(item.item as CommandItem).description}</div>
                  </div>
                  {(item.item as CommandItem).shortcut && (
                    <kbd className="px-2 py-1 text-[10px] text-mung-muted bg-mung-border/30 rounded">
                      {(item.item as CommandItem).shortcut}
                    </kbd>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// 主布局
export function MainLayout() {
  const [cmdOpen, setCmdOpen] = useState(false)
  const [cloudNotes, setCloudNotes] = useState<CloudNote[]>([])
  const editorRef = useRef<CatPinEditorRef>(null)
  
  // Hooks
  const { saveStatus, saveLocalDraft, deleteLocalDraft } = useLocalWorkspace()
  const { 
    mode, currentNote, localFilename, editedContent,
    loadFromCloud, checkoutForEdit, updateContent, exitEditMode, clearAll 
  } = useEditorMode()
  const { syncStatus, syncProgress, syncToCloud, fetchCloudNotes } = useCloudSync()

  // 加载云端笔记列表
  useEffect(() => {
    fetchCloudNotes().then(setCloudNotes)
  }, [fetchCloudNotes])

  // 从内容提取标题
  const title = useMemo(() => {
    const firstLine = editedContent.split('\n')[0]?.trim() || ''
    return firstLine.replace(/^#+\s*/, '') || '未命名笔记'
  }, [editedContent])

  // 命令列表
  const commands: CommandItem[] = useMemo(() => [
    { 
      id: 'new', 
      label: '新建笔记', 
      description: '创建空白笔记', 
      icon: <Plus className="w-4 h-4 text-mung-muted" />, 
      shortcut: 'Ctrl+N', 
      action: clearAll 
    },
    { 
      id: 'save', 
      label: '保存到本地', 
      description: '保存草稿到本地工作区', 
      icon: <Save className="w-4 h-4 text-mung-muted" />, 
      shortcut: 'Ctrl+S', 
      action: async () => {
        if (editedContent.trim()) {
          await saveLocalDraft(editedContent, localFilename || undefined)
        }
      }
    },
    { 
      id: 'sync', 
      label: '同步入库', 
      description: '同步到云端并清理本地', 
      icon: <Cloud className="w-4 h-4 text-emerald-600" />, 
      shortcut: 'Ctrl+Shift+S', 
      action: handleSyncToCloud 
    },
  ], [editedContent, localFilename, saveLocalDraft, clearAll])

  // 选择云端笔记（只读浏览）
  const handleNoteSelect = useCallback(async (note: CloudNote) => {
    loadFromCloud(note)
  }, [loadFromCloud])

  // 切换到编辑模式
  const handleEdit = useCallback(async () => {
    if (!currentNote) return
    
    // 检出到本地
    const filename = `${currentNote.title.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_')}.md`
    await saveLocalDraft(currentNote.content, filename)
    checkoutForEdit(currentNote, filename, currentNote.content)
  }, [currentNote, saveLocalDraft, checkoutForEdit])

  // 同步入库
  const handleSyncToCloud = useCallback(async () => {
    if (!editedContent.trim()) return

    const result = await syncToCloud(editedContent, currentNote?.id)
    
    if (result.success && localFilename) {
      // 清理本地草稿
      await deleteLocalDraft(localFilename)
      // 退出编辑态
      exitEditMode()
      // 刷新云端列表
      const notes = await fetchCloudNotes()
      setCloudNotes(notes)
    }
  }, [editedContent, currentNote, localFilename, syncToCloud, deleteLocalDraft, exitEditMode, fetchCloudNotes])

  // 快捷键
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setCmdOpen(p => !p) }
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') { e.preventDefault(); clearAll() }
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        if (e.shiftKey) {
          handleSyncToCloud()
        } else {
          saveLocalDraft(editedContent, localFilename || undefined)
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [clearAll, editedContent, localFilename, saveLocalDraft, handleSyncToCloud])

  const wordCount = editedContent.replace(/<[^>]*>/g, '').length
  const charCount = editedContent.replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean).length

  return (
    <GlobalBackground>
      <div className="flex h-screen w-screen">
        <main className="flex-1 flex flex-col h-full bg-mung-base min-w-0">
          {/* Header */}
          <header className="h-10 border-b border-mung-border flex items-center justify-between px-6 text-xs text-mung-muted">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded bg-mung-border/30 flex items-center justify-center">
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                </div>
                <span className="text-xs font-medium text-mung-text tracking-wider">AICATPIN</span>
              </div>
              <span className="text-mung-border">/</span>
              <span className="text-mung-muted italic">{title}</span>
              {mode === 'editing' && (
                <span className="text-emerald-600 text-[10px] px-1.5 py-0.5 bg-emerald-100 rounded">编辑中</span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <StatusIndicator localStatus={saveStatus} syncStatus={syncStatus} progress={syncProgress} />
              {mode === 'browsing' && currentNote ? (
                <button 
                  onClick={handleEdit}
                  className="flex items-center gap-1.5 px-2 py-1 text-xs text-mung-muted hover:text-mung-text hover:bg-mung-hover rounded"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>编辑</span>
                </button>
              ) : mode === 'editing' ? (
                <button 
                  onClick={handleSyncToCloud}
                  className="flex items-center gap-1.5 px-2 py-1 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded"
                >
                  <Cloud className="w-3 h-3" />
                  <span>入库</span>
                </button>
              ) : null}
              <button onClick={() => setCmdOpen(true)} className="flex items-center gap-2 px-2 py-1 text-xs text-mung-muted hover:text-mung-text hover:bg-mung-hover rounded">
                <Search className="w-3 h-3" /><span>Ctrl+K</span>
              </button>
            </div>
          </header>

          {/* 内容区 */}
          <div className="flex-1 overflow-y-auto" onClick={(e) => {
            const target = e.target as HTMLElement
            if (e.target === e.currentTarget || !target.closest('.ProseMirror')) {
              editorRef.current?.focus('end')
            }
          }}>
            <div className="max-w-2xl mx-auto px-8 py-12 min-h-[calc(100vh-7rem)]">
              {mode === 'browsing' && !currentNote ? (
                // 空白状态 - 显示提示
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-16 h-16 rounded-2xl bg-mung-border/20 flex items-center justify-center mb-4">
                    <Cloud className="w-8 h-8 text-mung-muted" />
                  </div>
                  <p className="text-mung-muted text-sm mb-2">开始记录你的想法</p>
                  <p className="text-mung-muted/50 text-xs">输入内容后按 Ctrl+S 保存到本地</p>
                </div>
              ) : (
                <CatPinEditor 
                  ref={editorRef} 
                  content={editedContent} 
                  onChange={updateContent} 
                  placeholder={mode === 'browsing' ? '' : '请输入主题...'} 
                  height="auto" 
                  className="border-0 bg-transparent" 
                  editable={mode === 'editing'}
                />
              )}
            </div>
          </div>

          {/* Footer */}
          <footer className="h-8 px-6 border-t border-mung-border flex items-center justify-between text-[11px] text-mung-muted">
            <div className="flex items-center gap-3">
              <span>字数: {wordCount}</span>
              <span className="text-mung-border">·</span>
              <span>词数: {charCount}</span>
            </div>
            <div className="flex items-center gap-3">
              {mode === 'editing' ? (
                <>
                  <span className="text-mung-muted/70">Ctrl+S 保存</span>
                  <span className="text-mung-muted/70">·</span>
                  <span className="text-emerald-600/70">Ctrl+Shift+S 入库</span>
                </>
              ) : (
                <span className="text-mung-muted/70">Ctrl+K 搜索</span>
              )}
            </div>
          </footer>
        </main>

        <CommandPalette 
          isOpen={cmdOpen} 
          onClose={() => setCmdOpen(false)} 
          commands={commands} 
          notes={cloudNotes}
          onNoteSelect={handleNoteSelect}
        />
      </div>
    </GlobalBackground>
  )
}

export default MainLayout
