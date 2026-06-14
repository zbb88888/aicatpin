import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { CatPinEditor } from '@/components/editor/CatPinEditor'
import { useCatPinSave, SaveStatus } from '@/hooks/useCatPinSave'
import { 
  Plus, 
  Sparkles,
  Network,
  X
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
                { label: '语义搜索', shortcut: 'Ctrl+K' },
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
  const [aiPanelOpen, setAiPanelOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  
  const { status, progress } = useCatPinSave()

  // 快捷键处理
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Shift+A: 打开 AI 面板
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'A') {
        e.preventDefault()
        setAiPanelOpen(prev => !prev)
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
            
            {/* 扁平路径 */}
            <div className="flex items-center gap-1.5">
              <span className="text-zinc-500">/</span>
              <span className="text-zinc-400">Programming</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* 新建笔记 */}
            <button className="flex items-center gap-1.5 px-2 py-1 text-xs text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 rounded transition-colors">
              <Plus className="w-3 h-3" />
              <span>新建</span>
            </button>

            {/* Ollama 模型 */}
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span>gemma4:e2b</span>
            </div>
            
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