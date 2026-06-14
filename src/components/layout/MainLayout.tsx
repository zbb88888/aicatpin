import { useState, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { CatPinEditor } from '@/components/editor/CatPinEditor'
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
  FileText
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
// 命令面板组件
// ============================================================

interface Command {
  id: string
  label: string
  description: string
  icon: React.ReactNode
  shortcut?: string
  action: () => void
}

function CommandPalette({ 
  isOpen, 
  onClose,
  commands 
}: { 
  isOpen: boolean
  onClose: () => void
  commands: Command[]
}) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  // 过滤命令
  const filteredCommands = commands.filter(cmd => 
    cmd.label.toLowerCase().includes(query.toLowerCase()) ||
    cmd.description.toLowerCase().includes(query.toLowerCase())
  )

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

  // 键盘事件
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex(prev => (prev > 0 ? prev - 1 : filteredCommands.length - 1))
          break
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex(prev => (prev < filteredCommands.length - 1 ? prev + 1 : 0))
          break
        case 'Enter':
          e.preventDefault()
          if (filteredCommands[selectedIndex]) {
            filteredCommands[selectedIndex].action()
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
  }, [isOpen, filteredCommands, selectedIndex, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      {/* 背景遮罩 */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* 命令面板 */}
      <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800/50 rounded-lg shadow-2xl overflow-hidden">
        {/* 搜索框 */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800/50">
          <Search className="w-4 h-4 text-zinc-500" />
          <input
            ref={inputRef}
            type="text"
            placeholder="输入命令..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none"
          />
          <kbd className="px-1.5 py-0.5 text-[10px] text-zinc-500 bg-zinc-800/50 rounded">
            ESC
          </kbd>
        </div>

        {/* 命令列表 */}
        <div className="max-h-80 overflow-y-auto">
          {filteredCommands.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-zinc-500">
              没有找到匹配的命令
            </div>
          ) : (
            filteredCommands.map((cmd, index) => (
              <button
                key={cmd.id}
                onClick={() => {
                  cmd.action()
                  onClose()
                }}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                  index === selectedIndex 
                    ? 'bg-zinc-800/50 text-zinc-200' 
                    : 'text-zinc-400 hover:bg-zinc-800/30'
                )}
              >
                <div className="w-8 h-8 rounded bg-zinc-800/50 flex items-center justify-center">
                  {cmd.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{cmd.label}</div>
                  <div className="text-xs text-zinc-500 truncate">{cmd.description}</div>
                </div>
                {cmd.shortcut && (
                  <kbd className="px-1.5 py-0.5 text-[10px] text-zinc-500 bg-zinc-800/50 rounded">
                    {cmd.shortcut}
                  </kbd>
                )}
              </button>
            ))
          )}
        </div>

        {/* 底部提示 */}
        <div className="px-4 py-2 border-t border-zinc-800/50 flex items-center justify-between text-[10px] text-zinc-500">
          <div className="flex items-center gap-2">
            <kbd className="px-1 py-0.5 bg-zinc-800/50 rounded">↑↓</kbd>
            <span>导航</span>
          </div>
          <div className="flex items-center gap-2">
            <kbd className="px-1 py-0.5 bg-zinc-800/50 rounded">Enter</kbd>
            <span>执行</span>
          </div>
          <div className="flex items-center gap-2">
            <kbd className="px-1 py-0.5 bg-zinc-800/50 rounded">Esc</kbd>
            <span>关闭</span>
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
          <div className="p-3 rounded bg-zinc-900/30 border border-zinc-800/30">
            <StatusIndicator status={status} progress={progress} />
          </div>

          {/* 快捷操作 */}
          <div className="space-y-2">
            <h4 className="text-[10px] font-medium text-zinc-600 uppercase tracking-wider">
              快捷操作
            </h4>
            <div className="space-y-0.5">
              {[
                { label: '生成摘要', shortcut: 'Ctrl+Shift+S' },
                { label: '提取标签', shortcut: 'Ctrl+Shift+T' },
                { label: '关联图谱', shortcut: 'Ctrl+Shift+G' },
              ].map((action) => (
                <button
                  key={action.label}
                  className="w-full flex items-center justify-between px-2 py-1.5 text-xs text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/30 rounded transition-colors"
                >
                  <span>{action.label}</span>
                  <kbd className="px-1 py-0.5 text-[9px] text-zinc-700 bg-zinc-900 rounded">
                    {action.shortcut}
                  </kbd>
                </button>
              ))}
            </div>
          </div>

          {/* 知识图谱预览 */}
          <div className="space-y-2">
            <h4 className="text-[10px] font-medium text-zinc-600 uppercase tracking-wider">
              关联图谱
            </h4>
            <div className="h-32 rounded bg-zinc-900/30 border border-zinc-800/30 flex items-center justify-center">
              <div className="text-center">
                <Network className="w-6 h-6 text-zinc-800 mx-auto mb-1" />
                <p className="text-[10px] text-zinc-700">
                  暂无关联数据
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
  
  const { status, progress } = useCatPinSave()

  // 命令列表
  const commands: Command[] = [
    {
      id: 'new',
      label: '新建笔记',
      description: '创建一个新的空白笔记',
      icon: <Plus className="w-4 h-4 text-zinc-400" />,
      shortcut: 'Ctrl+N',
      action: () => {
        setTitle('')
        setContent('')
      }
    },
    {
      id: 'save',
      label: '保存笔记',
      description: '保存当前笔记到数据库',
      icon: <Save className="w-4 h-4 text-zinc-400" />,
      shortcut: 'Ctrl+S',
      action: () => {
        // 触发保存
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
      id: 'category',
      label: '搜索分类',
      description: '在数据库中搜索分类',
      icon: <Folder className="w-4 h-4 text-zinc-400" />,
      action: () => console.log('搜索分类')
    },
    {
      id: 'tag',
      label: '搜索标签',
      description: '在数据库中搜索标签',
      icon: <Hash className="w-4 h-4 text-zinc-400" />,
      action: () => console.log('搜索标签')
    },
    {
      id: 'search',
      label: '全文搜索',
      description: '在所有笔记中搜索内容',
      icon: <Search className="w-4 h-4 text-zinc-400" />,
      action: () => console.log('全文搜索')
    },
    {
      id: 'notes',
      label: '笔记列表',
      description: '查看所有笔记',
      icon: <FileText className="w-4 h-4 text-zinc-400" />,
      action: () => console.log('笔记列表')
    },
    {
      id: 'settings',
      label: '设置',
      description: '打开应用设置',
      icon: <Settings className="w-4 h-4 text-zinc-400" />,
      action: () => console.log('设置')
    },
    {
      id: 'help',
      label: '帮助',
      description: '查看快捷键和命令列表',
      icon: <HelpCircle className="w-4 h-4 text-zinc-400" />,
      shortcut: 'F1',
      action: () => console.log('帮助')
    },
  ]

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
      }

      // F1: 帮助
      if (e.key === 'F1') {
        e.preventDefault()
        setCommandPaletteOpen(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
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
            
            {/* 扁平路径 - 等待真实数据 */}
            <div className="flex items-center gap-1.5">
              <span className="text-zinc-500">/</span>
              <span className="text-zinc-600 italic">未分类</span>
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
          <div className="max-w-2xl mx-auto px-8 py-10">
            {/* 标题输入 */}
            <input
              type="text"
              placeholder="请输入主题"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-2xl font-bold bg-transparent text-zinc-100 placeholder-zinc-700 focus:outline-none mb-4"
            />

            {/* TipTap 编辑器 */}
            <CatPinEditor
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