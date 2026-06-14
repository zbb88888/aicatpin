import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { CatPinEditor, type CatPinEditorRef } from '@/components/editor/CatPinEditor'
import { useCatPinSave } from '@/hooks/useCatPinSave'
import type { SaveStatus } from '@/types'
import { 
  Sparkles,
  Network,
  X,
  Search,
  Plus,
  Folder,
  Hash,
  HelpCircle,
  Save,
  Settings,
  FileText,
  ArrowRight,
  Command
} from 'lucide-react'

// ============================================================
// 状态指示器组件
// ============================================================

function StatusIndicator({ status, progress }: { status: SaveStatus; progress: string }) {
  const statusConfig = {
    idle: { color: 'text-zinc-500', dot: 'bg-zinc-500', text: '已同步' },
    extracting: { color: 'text-cyan-400', dot: 'bg-cyan-400 animate-pulse', text: 'AI 重构中...' },
    embedding: { color: 'text-cyan-400', dot: 'bg-cyan-400 animate-pulse', text: '向量计算中...' },
    saving: { color: 'text-cyan-400', dot: 'bg-cyan-400 animate-pulse', text: '持久化中...' },
    syncing: { color: 'text-cyan-400', dot: 'bg-cyan-400 animate-pulse', text: '同步至文件系统...' },
    success: { color: 'text-emerald-400', dot: 'bg-emerald-400', text: '已原子化落盘' },
    error: { color: 'text-red-400', dot: 'bg-red-400', text: '保存失败' },
  }

  const config = statusConfig[status]

  return (
    <div className={cn('flex items-center gap-2 text-xs', config.color)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', config.dot)} />
      <span>{progress || config.text}</span>
    </div>
  )
}

// ============================================================
// 命令类型定义
// ============================================================

interface CommandItem {
  id: string
  label: string
  description: string
  icon: React.ReactNode
  shortcut?: string
  category?: string
  action: () => void
}

interface NoteItem {
  id: string
  title: string
  summary: string
  category: string
  tags: string[]
  updated: string
}

// ============================================================
// 命令面板组件
// ============================================================

function CommandPalette({ 
  isOpen, 
  onClose,
  commands,
  notes: _notes,
  onNoteSelect
}: { 
  isOpen: boolean
  onClose: () => void
  commands: CommandItem[]
  notes: NoteItem[]
  onNoteSelect: (note: NoteItem) => void
}) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // 解析前缀路由
  const mode = useMemo(() => {
    if (query.startsWith('>')) return 'actions'
    if (query.startsWith('/')) return 'namespaces'
    if (query.startsWith('#')) return 'tags'
    return 'search'
  }, [query])

  // 获取搜索词（去除前缀）
  const searchQuery = useMemo(() => {
    return query.slice(1).trim()
  }, [query])

  // 模拟分类数据
  const namespaces = useMemo(() => [
    { name: 'Networking', count: 24 },
    { name: 'Kernel', count: 18 },
    { name: 'Database', count: 15 },
    { name: 'Systems', count: 21 },
    { name: 'Security', count: 12 },
    { name: 'Programming', count: 32 },
    { name: 'DevOps', count: 9 },
    { name: 'AI', count: 7 },
  ], [])

  // 模拟标签数据
  const tags = useMemo(() => [
    { name: 'rust', count: 45 },
    { name: 'linux', count: 38 },
    { name: 'tcp/ip', count: 29 },
    { name: 'security', count: 27 },
    { name: 'database', count: 24 },
    { name: 'performance', count: 22 },
    { name: 'networking', count: 20 },
    { name: 'kernel', count: 18 },
  ], [])

  // 模拟笔记数据
  const mockNotes: NoteItem[] = useMemo(() => [
    {
      id: '1',
      title: 'TCP/IP 协议栈深度解析',
      summary: 'TCP/IP 协议栈是互联网的基础，它定义了数据如何在网络中传输...',
      category: 'Networking',
      tags: ['tcp/ip', 'networking', 'protocol'],
      updated: '2 小时前'
    },
    {
      id: '2',
      title: 'Rust 所有权系统详解',
      summary: 'Rust 的所有权系统是其最独特的特性之一，它确保了内存安全...',
      category: 'Programming',
      tags: ['rust', 'ownership', 'memory-safety'],
      updated: '5 小时前'
    },
    {
      id: '3',
      title: 'Linux 内核调度器原理',
      summary: 'Linux 内核调度器负责决定哪个进程在何时运行...',
      category: 'Kernel',
      tags: ['linux', 'kernel', 'scheduler'],
      updated: '1 天前'
    },
    {
      id: '4',
      title: 'PostgreSQL 索引优化策略',
      summary: '数据库索引是提高查询性能的关键技术...',
      category: 'Database',
      tags: ['postgresql', 'database', 'index'],
      updated: '2 天前'
    },
  ], [])

  // 过滤结果
  const filteredItems = useMemo(() => {
    switch (mode) {
      case 'actions':
        return commands.filter(cmd => 
          cmd.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          cmd.description.toLowerCase().includes(searchQuery.toLowerCase())
        ).map(cmd => ({ type: 'command' as const, item: cmd }))
      
      case 'namespaces':
        return namespaces
          .filter(ns => ns.name.toLowerCase().includes(searchQuery.toLowerCase()))
          .map(ns => ({ type: 'namespace' as const, item: ns }))
      
      case 'tags':
        return tags
          .filter(tag => tag.name.toLowerCase().includes(searchQuery.toLowerCase()))
          .map(tag => ({ type: 'tag' as const, item: tag }))
      
      case 'search':
      default:
        return mockNotes
          .filter(note => 
            note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            note.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
            note.tags.some(tag => tag.includes(searchQuery.toLowerCase()))
          )
          .map(note => ({ type: 'note' as const, item: note }))
    }
  }, [mode, searchQuery, commands, namespaces, tags, mockNotes])

  // 重置选中索引
  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  // 聚焦输入框
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
    } else {
      setQuery('')
    }
  }, [isOpen])

  // 滚动到选中项
  useEffect(() => {
    if (listRef.current) {
      const selectedElement = listRef.current.querySelector(`[data-index="${selectedIndex}"]`)
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      }
    }
  }, [selectedIndex])

  // 键盘事件
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex(prev => (prev > 0 ? prev - 1 : filteredItems.length - 1))
          break
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex(prev => (prev < filteredItems.length - 1 ? prev + 1 : 0))
          break
        case 'Enter':
          e.preventDefault()
          if (filteredItems[selectedIndex]) {
            const selected = filteredItems[selectedIndex]
            if (selected.type === 'command') {
              (selected.item as CommandItem).action()
            } else if (selected.type === 'note') {
              onNoteSelect(selected.item as NoteItem)
            } else if (selected.type === 'namespace') {
              // 切换到该命名空间的搜索
              setQuery('')
              console.log('Switch to namespace:', (selected.item as { name: string }).name)
            } else if (selected.type === 'tag') {
              // 切换到该标签的搜索
              setQuery('')
              console.log('Switch to tag:', (selected.item as { name: string }).name)
            }
            onClose()
          }
          break
        case 'Escape':
          e.preventDefault()
          onClose()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, filteredItems, selectedIndex, onClose, onNoteSelect])

  if (!isOpen) return null

  // 获取模式提示
  const getModeHint = () => {
    switch (mode) {
      case 'actions':
        return { icon: <Command className="w-3 h-3" />, text: '动作模式', color: 'text-amber-400' }
      case 'namespaces':
        return { icon: <Folder className="w-3 h-3" />, text: '分类过滤', color: 'text-emerald-400' }
      case 'tags':
        return { icon: <Hash className="w-3 h-3" />, text: '标签过滤', color: 'text-purple-400' }
      case 'search':
      default:
        return { icon: <Search className="w-3 h-3" />, text: '全局搜索', color: 'text-cyan-400' }
    }
  }

  const modeHint = getModeHint()

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      {/* 背景遮罩 */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* 命令面板 */}
      <div className="relative w-full max-w-2xl bg-zinc-900/95 border border-zinc-800/50 rounded-xl shadow-2xl overflow-hidden backdrop-blur-xl">
        {/* 搜索框 */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-zinc-800/50">
          <div className={cn('flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-medium', modeHint.color, 'bg-zinc-800/50')}>
            {modeHint.icon}
            <span>{modeHint.text}</span>
          </div>
          <input
            ref={inputRef}
            type="text"
            placeholder={
              mode === 'actions' ? '搜索命令...' :
              mode === 'namespaces' ? '搜索分类...' :
              mode === 'tags' ? '搜索标签...' :
                '搜索笔记...'
            }
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none"
          />
          <kbd className="px-1.5 py-0.5 text-[10px] text-zinc-500 bg-zinc-800/50 rounded">
            ESC
          </kbd>
        </div>

        {/* 前缀提示 */}
        {query === '' && (
          <div className="px-4 py-2 border-b border-zinc-800/30 flex items-center gap-4 text-[10px] text-zinc-600">
            <span><kbd className="px-1 py-0.5 bg-zinc-800/50 rounded">&gt;</kbd> 命令</span>
            <span><kbd className="px-1 py-0.5 bg-zinc-800/50 rounded">/</kbd> 分类</span>
            <span><kbd className="px-1 py-0.5 bg-zinc-800/50 rounded">#</kbd> 标签</span>
            <span>直接输入 搜索笔记</span>
          </div>
        )}

        {/* 结果列表 */}
        <div ref={listRef} className="max-h-[400px] overflow-y-auto">
          {filteredItems.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <Search className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
              <p className="text-sm text-zinc-500">没有找到匹配的内容</p>
              <p className="text-xs text-zinc-600 mt-1">尝试使用不同的关键词</p>
            </div>
          ) : (
            filteredItems.map((result, index) => (
              <div
                key={index}
                data-index={index}
                onClick={() => {
                  if (result.type === 'command') {
                    (result.item as CommandItem).action()
                  } else if (result.type === 'note') {
                    onNoteSelect(result.item as NoteItem)
                  }
                  onClose()
                }}
                className={cn(
                  'px-4 py-3 cursor-pointer transition-colors',
                  index === selectedIndex 
                    ? 'bg-zinc-800/50' 
                    : 'hover:bg-zinc-800/30'
                )}
              >
                {result.type === 'command' && (() => {
                  const cmd = result.item as CommandItem
                  return (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-zinc-800/50 flex items-center justify-center">
                        {cmd.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-zinc-200">{cmd.label}</div>
                        <div className="text-xs text-zinc-500 truncate">{cmd.description}</div>
                      </div>
                      {cmd.shortcut && (
                        <kbd className="px-2 py-1 text-[10px] text-zinc-500 bg-zinc-800/50 rounded">
                          {cmd.shortcut}
                        </kbd>
                      )}
                    </div>
                  )
                })()}

                {result.type === 'note' && (() => {
                  const note = result.item as NoteItem
                  return (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-zinc-800/50 flex items-center justify-center mt-0.5">
                        <FileText className="w-4 h-4 text-zinc-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-zinc-200">{note.title}</div>
                        <div className="text-xs text-zinc-500 mt-1 line-clamp-2">{note.summary}</div>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-[10px] text-zinc-600">{note.category}</span>
                          <span className="text-zinc-700">·</span>
                          <span className="text-[10px] text-zinc-600">{note.updated}</span>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-zinc-600 mt-1" />
                    </div>
                  )
                })()}

                {result.type === 'namespace' && (() => {
                  const ns = result.item as { name: string; count: number }
                  return (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-zinc-800/50 flex items-center justify-center">
                        <Folder className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-zinc-200">/{ns.name}</div>
                        <div className="text-xs text-zinc-500">{ns.count} 篇笔记</div>
                      </div>
                    </div>
                  )
                })()}

                {result.type === 'tag' && (() => {
                  const tag = result.item as { name: string; count: number }
                  return (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-zinc-800/50 flex items-center justify-center">
                        <Hash className="w-4 h-4 text-purple-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-zinc-200">#{tag.name}</div>
                        <div className="text-xs text-zinc-500">{tag.count} 篇笔记</div>
                      </div>
                    </div>
                  )
                })()}
              </div>
            ))
          )}
        </div>

        {/* 底部提示 */}
        <div className="px-4 py-2.5 border-t border-zinc-800/50 flex items-center justify-between text-[10px] text-zinc-600">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-zinc-800/50 rounded">↑↓</kbd>
              <span>导航</span>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-zinc-800/50 rounded">Enter</kbd>
              <span>选择</span>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-zinc-800/50 rounded">Esc</kbd>
              <span>关闭</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span>{filteredItems.length} 个结果</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// 右侧 AI 面板组件
// ============================================================

function AIPanel({ 
  isOpen, 
  onClose,
  status,
  progress 
}: { 
  isOpen: boolean
  onClose: () => void
  status: SaveStatus
  progress: string
}) {
  if (!isOpen) return null

  return (
    <aside className="w-72 h-full border-l border-zinc-800/30 bg-zinc-950/80 flex flex-col">
      {/* 头部 */}
      <div className="p-3 flex items-center justify-between border-b border-zinc-800/30">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-xs font-medium text-zinc-400">AI 协作</span>
        </div>
        <button 
          onClick={onClose}
          className="p-1 hover:bg-zinc-800/50 rounded transition-colors"
        >
          <X className="w-3.5 h-3.5 text-zinc-600" />
        </button>
      </div>

      {/* 内容 */}
      <div className="flex-1 p-3 overflow-y-auto">
        <div className="space-y-4">
          {/* 状态卡片 */}
          <div className="p-3 rounded-lg bg-zinc-900/30 border border-zinc-800/30">
            <StatusIndicator status={status} progress={progress} />
          </div>

          {/* 快捷操作 */}
          <div className="space-y-2">
            <h4 className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">
              快捷操作
            </h4>
            <div className="space-y-1">
              {[
                { label: '生成摘要', shortcut: 'Ctrl+Shift+S', icon: '✨' },
                { label: '提取标签', shortcut: 'Ctrl+Shift+T', icon: '🏷️' },
                { label: '关联图谱', shortcut: 'Ctrl+Shift+G', icon: '🔗' },
                { label: '语义搜索', shortcut: 'Ctrl+K', icon: '🔍' },
              ].map((action) => (
                <button
                  key={action.label}
                  className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/30 rounded-lg transition-colors"
                >
                  <span>{action.icon}</span>
                  <span className="flex-1 text-left">{action.label}</span>
                  <kbd className="px-1.5 py-0.5 text-[9px] text-zinc-600 bg-zinc-800/50 rounded">
                    {action.shortcut}
                  </kbd>
                </button>
              ))}
            </div>
          </div>

          {/* 知识图谱预览 */}
          <div className="space-y-2">
            <h4 className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">
              关联图谱
            </h4>
            <div className="h-36 rounded-lg bg-zinc-900/30 border border-zinc-800/30 flex items-center justify-center">
              <div className="text-center">
                <Network className="w-8 h-8 text-zinc-800 mx-auto mb-2" />
                <p className="text-[10px] text-zinc-600">
                  暂无关联数据
                </p>
                <p className="text-[10px] text-zinc-700 mt-1">
                  保存笔记后自动生成
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}

// ============================================================
// 主布局组件
// ============================================================

export function MainLayout() {
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)
  const [aiPanelOpen, setAiPanelOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const editorRef = useRef<CatPinEditorRef>(null)
  
  const { status, progress } = useCatPinSave()

  // 命令列表
  const commands: CommandItem[] = useMemo(() => [
    {
      id: 'new',
      label: '新建笔记',
      description: '创建一个新的空白笔记',
      icon: <Plus className="w-4 h-4 text-zinc-400" />,
      shortcut: 'Ctrl+N',
      action: () => {
        setTitle('')
        setContent('')
        setTimeout(() => editorRef.current?.focus(), 100)
      }
    },
    {
      id: 'save',
      label: '保存笔记',
      description: '保存当前笔记到数据库',
      icon: <Save className="w-4 h-4 text-zinc-400" />,
      shortcut: 'Ctrl+S',
      action: () => {
        const event = new CustomEvent('editor-save')
        window.dispatchEvent(event)
      }
    },
    {
      id: 'ai',
      label: 'AI 协作',
      description: '打开 AI 协作面板',
      icon: <Sparkles className="w-4 h-4 text-cyan-400" />,
      shortcut: 'Ctrl+Shift+A',
      action: () => setAiPanelOpen(true)
    },
    {
      id: 'settings',
      label: '设置',
      description: '打开应用设置',
      icon: <Settings className="w-4 h-4 text-zinc-400" />,
      action: () => console.log('Settings')
    },
    {
      id: 'help',
      label: '帮助',
      description: '查看快捷键和命令列表',
      icon: <HelpCircle className="w-4 h-4 text-zinc-400" />,
      shortcut: 'F1',
      action: () => console.log('Help')
    },
  ], [])

  // 选中笔记回调
  const handleNoteSelect = useCallback((note: { id: string; title: string; summary: string; category: string; tags: string[] }) => {
    // 设置标题
    setTitle(note.title)
    
    // 模拟加载笔记内容
    const mockContent = `# ${note.title}

${note.summary}

## 核心概念

这里是笔记的主要内容...

## 详细说明

1. 第一点
2. 第二点
3. 第三点

## 代码示例

\`\`\`javascript
function example() {
  console.log("Hello, AICatPin!");
}
\`\`\`

## 总结

这是笔记的总结部分。`
    
    setContent(mockContent)
    
    // 聚焦编辑器
    setTimeout(() => {
      editorRef.current?.focus('end')
    }, 100)
  }, [])

  // 快捷键处理
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K: 打开命令面板
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCommandPaletteOpen(prev => !prev)
      }
      
      // Ctrl+Shift+A: 打开 AI 面板
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'A') {
        e.preventDefault()
        setAiPanelOpen(prev => !prev)
      }

      // Ctrl+N: 新建笔记
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault()
        setTitle('')
        setContent('')
        setTimeout(() => editorRef.current?.focus(), 100)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // 标题回车键处理
  const handleTitleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      editorRef.current?.focus()
    }
  }, [])

  return (
    <div className="flex h-screen w-screen bg-zinc-950 text-zinc-200 font-sans antialiased selection:bg-cyan-500/20">
      {/* 中间主内容区 */}
      <main className="flex-1 flex flex-col h-full bg-zinc-950 min-w-0">
        {/* 顶部状态条 */}
        <header className="h-10 border-b border-zinc-800/20 flex items-center justify-between px-6 text-xs text-zinc-600">
          <div className="flex items-center gap-3">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-zinc-800 flex items-center justify-center">
                <Sparkles className="w-3 h-3 text-zinc-400" />
              </div>
              <span className="text-xs font-medium text-zinc-400 tracking-wider">AICATPIN</span>
            </div>
            
            {/* 扁平路径 */}
            <div className="flex items-center gap-1.5">
              <span className="text-zinc-700">/</span>
              <span className="text-zinc-500 italic">未分类</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Ollama 模型 */}
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span>gemma4:e2b</span>
            </div>

            {/* 命令面板 */}
            <button
              onClick={() => setCommandPaletteOpen(true)}
              className="flex items-center gap-2 px-2 py-1 text-xs text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 rounded transition-colors"
            >
              <Search className="w-3 h-3" />
              <span>Ctrl+K</span>
            </button>
            
            {/* AI 面板切换 */}
            <button
              onClick={() => setAiPanelOpen(prev => !prev)}
              className={cn(
                'p-1 rounded transition-colors',
                aiPanelOpen ? 'bg-zinc-800/50 text-zinc-400' : 'hover:bg-zinc-800/30'
              )}
            >
              <Sparkles className="w-3.5 h-3.5" />
            </button>
          </div>
        </header>

        {/* 编辑器区域 */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-8 py-12">
            {/* 标题输入 */}
            <input
              type="text"
              placeholder="请输入主题"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={handleTitleKeyDown}
              className="w-full text-4xl font-extrabold tracking-tight leading-tight bg-transparent text-zinc-100 placeholder-zinc-700 focus:outline-none focus:ring-0 border-none mb-6 pb-4 border-b border-zinc-800/30"
            />

            {/* TipTap 编辑器 */}
            <CatPinEditor
              ref={editorRef}
              content={content}
              onChange={setContent}
              placeholder="开始记录..."
              height="auto"
              className="border-0 bg-transparent"
            />
          </div>
        </div>

        {/* 底部状态栏 */}
        <footer className="h-8 px-6 border-t border-zinc-800/20 flex items-center justify-between text-[11px] text-zinc-600">
          <div className="flex items-center gap-3">
            <span>
              字数: {content.replace(/<[^>]*>/g, '').length}
            </span>
            <span className="text-zinc-800">·</span>
            <span>
              词数: {content.replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean).length}
            </span>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="text-zinc-700">Ctrl+S 保存</span>
            <StatusIndicator status={status} progress={progress} />
          </div>
        </footer>
      </main>

      {/* 命令面板 */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        commands={commands}
        notes={[]}
        onNoteSelect={handleNoteSelect}
      />

      {/* 右侧 AI 面板 */}
      <AIPanel
        isOpen={aiPanelOpen}
        onClose={() => setAiPanelOpen(false)}
        status={status}
        progress={progress}
      />
    </div>
  )
}

export default MainLayout