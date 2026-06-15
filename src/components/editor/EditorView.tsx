import { useEffect, useRef, useCallback, useMemo, useState } from 'react'
import { useAppRouter } from '@/stores/appRouter'
import { useLocalWorkspace } from '@/hooks/useLocalWorkspace'
import { useEditorMode } from '@/hooks/useEditorMode'
import { useCloudSync } from '@/hooks/useCloudSync'
import { CatPinEditor, type CatPinEditorRef } from '@/components/editor/CatPinEditor'
import { GlobalBackground } from '@/components/Background'
import type { CloudNote } from '@/hooks/useEditorMode'
import { Sparkles, Search, MessageSquare } from 'lucide-react'

type LocalSaveStatus = 'idle' | 'saving' | 'saved' | 'error'
type SyncStatus = 'idle' | 'extracting' | 'embedding' | 'uploading' | 'done' | 'error'

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
    extracting: { color: 'text-emerald-600', dot: 'bg-emerald-500 animate-pulse', text: 'AI 提炼中...' },
    embedding: { color: 'text-emerald-600', dot: 'bg-emerald-500 animate-pulse', text: '向量计算中...' },
    uploading: { color: 'text-emerald-600', dot: 'bg-emerald-500 animate-pulse', text: '同步入库中...' },
    done: { color: 'text-emerald-700', dot: 'bg-emerald-600', text: '✓ 已入库' },
    error: { color: 'text-red-600', dot: 'bg-red-500', text: '失败' },
  }

  const status = syncStatus !== 'idle' ? syncStatus : localStatus
  const current = cfg[status] || cfg.idle
  const displayText = progress || current.text

  if (!displayText) return null

  return (
    <div className={`flex items-center gap-2 text-xs transition-all ${current.color}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${current.dot}`} />
      <span>{displayText}</span>
    </div>
  )
}

// 命令面板
function CommandPalette({ isOpen, onClose, notes, onNoteSelect }: { 
  isOpen: boolean
  onClose: () => void
  notes: CloudNote[]
  onNoteSelect: (note: CloudNote) => void
}) {
  const [query, setQuery] = useState('')
  const [idx, setIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const filtered = useMemo(() => {
    if (!query) return notes
    return notes.filter(n => 
      n.title.toLowerCase().includes(query.toLowerCase()) ||
      n.content.toLowerCase().includes(query.toLowerCase())
    )
  }, [notes, query])

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
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
        onNoteSelect(filtered[idx])
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
          ) : filtered.map((note, i) => (
            <div 
              key={note.id} 
              onClick={() => { onNoteSelect(note); onClose() }}
              className={`px-4 py-2.5 flex items-center gap-3 cursor-pointer ${i === idx ? 'bg-mung-hover' : 'hover:bg-mung-hover/50'}`}
            >
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-mung-text truncate">{note.title}</div>
                <div className="text-xs text-mung-muted truncate">{note.category}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function EditorView() {
  const { shuttlePayload, pinToChat, switchView, clearShuttlePayload } = useAppRouter()
  const { saveStatus, saveLocalDraft, deleteLocalDraft } = useLocalWorkspace()
  const { 
    currentNote, localFilename, editedContent,
    loadFromCloud, updateContent, exitEditMode, clearAll 
  } = useEditorMode()
  const { syncStatus, syncProgress, syncToCloud, fetchCloudNotes } = useCloudSync()
  
  const [cmdOpen, setCmdOpen] = useState(false)
  const [cloudNotes, setCloudNotes] = useState<CloudNote[]>([])
  const editorRef = useRef<CatPinEditorRef>(null)

  // 加载云端笔记列表
  useEffect(() => {
    fetchCloudNotes().then(setCloudNotes)
  }, [fetchCloudNotes])

  // 从内容提取标题
  const title = useMemo(() => {
    const firstLine = editedContent.split('\n')[0]?.trim() || ''
    return firstLine.replace(/^#+\s*/, '') || '未命名笔记'
  }, [editedContent])

  // 处理从 Chat 视图 Pin 过来的内容（自动插入）
  useEffect(() => {
    if (shuttlePayload && shuttlePayload.title) {
      // 有 title 说明是从 Chat Pin 到编辑器的
      const editor = editorRef.current?.getEditor()
      if (editor) {
        const { from } = editor.state.selection
        const insertHtml = `<h2>${shuttlePayload.title}</h2>\n${shuttlePayload.content}`
        editor.chain()
          .focus()
          .insertContentAt(from, insertHtml)
          .run()
      }
      clearShuttlePayload()
    }
  }, [shuttlePayload, clearShuttlePayload])

  // Pin 选中文本到 Chat
  const handlePinToChat = useCallback(() => {
    const editor = editorRef.current?.getEditor()
    if (!editor) return
    
    const { from, to } = editor.state.selection
    if (from === to) return // 没有选中文本
    
    const selectedText = editor.state.doc.textBetween(from, to, '\n')
    if (selectedText.trim()) {
      pinToChat(selectedText)
    }
  }, [pinToChat])

  // 同步入库
  const handleSyncToCloud = useCallback(async () => {
    if (!editedContent.trim()) return

    const result = await syncToCloud(editedContent, currentNote?.id)
    
    if (result.success && localFilename) {
      await deleteLocalDraft(localFilename)
      exitEditMode()
      const notes = await fetchCloudNotes()
      setCloudNotes(notes)
    }
  }, [editedContent, currentNote, localFilename, syncToCloud, deleteLocalDraft, exitEditMode, fetchCloudNotes])

  // 选择云端笔记
  const handleNoteSelect = useCallback(async (note: CloudNote) => {
    loadFromCloud(note)
  }, [loadFromCloud])



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
            </div>
            <div className="flex items-center gap-3">
              <StatusIndicator localStatus={saveStatus as LocalSaveStatus} syncStatus={syncStatus as SyncStatus} progress={syncProgress} />
              <button 
                onClick={() => switchView('chat')}
                className="flex items-center gap-1.5 px-2 py-1 text-xs text-mung-muted hover:text-mung-text hover:bg-mung-hover rounded"
              >
                <MessageSquare className="w-3 h-3" />
                <span>chat</span>
              </button>
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
              <CatPinEditor 
                ref={editorRef} 
                content={editedContent} 
                onChange={updateContent} 
                placeholder="请输入主题..." 
                height="auto" 
                className="border-0 bg-transparent" 
                editable
                onPinToChat={handlePinToChat}
              />
            </div>
          </div>

          {/* Footer */}
          <footer className="h-8 px-6 border-t border-mung-border flex items-center justify-between text-[11px] text-mung-muted">
            <div className="flex items-center gap-3">
              <span>字数: {wordCount}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-emerald-600/70">Ctrl+Shift+S 入库</span>
            </div>
          </footer>
        </main>

        <CommandPalette 
          isOpen={cmdOpen} 
          onClose={() => setCmdOpen(false)} 
          notes={cloudNotes}
          onNoteSelect={handleNoteSelect}
        />
      </div>
    </GlobalBackground>
  )
}

export default EditorView
