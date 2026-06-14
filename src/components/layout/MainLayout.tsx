import React, { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { CatPinEditor } from '@/components/editor/CatPinEditor'
import { useCatPinSave, SaveStatus } from '@/hooks/useCatPinSave'
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Search, 
  Settings,
  FileText,
  Hash,
  Folder,
  Sparkles,
  Network
} from 'lucide-react'

// ============================================================
// 类型定义
// ============================================================

interface Category {
  id: string
  name: string
  icon: React.ReactNode
  count: number
}

interface Tag {
  name: string
  count: number
}

// ============================================================
// 模拟数据
// ============================================================

const categories: Category[] = [
  { id: 'networking', name: 'Networking', icon: <Network className="w-4 h-4" />, count: 24 },
  { id: 'kernel', name: 'Kernel', icon: <Settings className="w-4 h-4" />, count: 18 },
  { id: 'database', name: 'Database', icon: <Folder className="w-4 h-4" />, count: 15 },
  { id: 'systems', name: 'Systems', icon: <FileText className="w-4 h-4" />, count: 21 },
  { id: 'security', name: 'Security', icon: <Hash className="w-4 h-4" />, count: 12 },
  { id: 'programming', name: 'Programming', icon: <Sparkles className="w-4 h-4" />, count: 32 },
]

const popularTags: Tag[] = [
  { name: 'rust', count: 45 },
  { name: 'linux', count: 38 },
  { name: 'tcp/ip', count: 29 },
  { name: 'security', count: 27 },
  { name: 'database', count: 24 },
  { name: 'performance', count: 22 },
  { name: 'networking', count: 20 },
  { name: 'kernel', count: 18 },
]

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
// 左侧导航组件
// ============================================================

function Sidebar({ 
  isCollapsed, 
  onToggle,
  selectedCategory,
  onSelectCategory 
}: { 
  isCollapsed: boolean
  onToggle: () => void
  selectedCategory: string
  onSelectCategory: (id: string) => void
}) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredCategories = categories.filter(cat => 
    cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <aside 
      className={cn(
        'h-full border-r border-zinc-800/50 bg-zinc-950/80 flex flex-col transition-all duration-300',
        isCollapsed ? 'w-0 overflow-hidden' : 'w-60'
      )}
    >
      {/* Logo */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-zinc-800 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
          </div>
          <span className="text-sm font-medium text-zinc-300">AICatPin</span>
        </div>
        <button 
          onClick={onToggle}
          className="p-1 hover:bg-zinc-800 rounded transition-colors"
        >
          <ChevronLeft className="w-4 h-4 text-zinc-500" />
        </button>
      </div>

      {/* 搜索 */}
      <div className="px-3 mb-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-500" />
          <input
            type="text"
            placeholder="搜索分类..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-xs bg-zinc-900/50 border border-zinc-800/50 rounded-md text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-zinc-700"
          />
        </div>
      </div>

      {/* 分类列表 */}
      <div className="flex-1 overflow-y-auto px-3">
        <div className="mb-2">
          <div className="flex items-center justify-between px-2 mb-1">
            <span className="text-[10px] font-medium text-zinc-600 uppercase tracking-wider">
              Namespaces
            </span>
            <button className="p-0.5 hover:bg-zinc-800 rounded transition-colors">
              <Plus className="w-3 h-3 text-zinc-500" />
            </button>
          </div>
          
          <div className="space-y-0.5">
            {filteredCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => onSelectCategory(category.id)}
                className={cn(
                  'w-full flex items-center justify-between px-2 py-1.5 rounded text-sm transition-colors',
                  selectedCategory === category.id
                    ? 'bg-zinc-800/50 text-zinc-200'
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50'
                )}
              >
                <div className="flex items-center gap-2">
                  {category.icon}
                  <span>{category.name}</span>
                </div>
                <span className="text-xs text-zinc-600">{category.count}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 标签云 */}
        <div className="mt-4">
          <div className="flex items-center justify-between px-2 mb-2">
            <span className="text-[10px] font-medium text-zinc-600 uppercase tracking-wider">
              Tags
            </span>
          </div>
          
          <div className="flex flex-wrap gap-1.5 px-2">
            {popularTags.map((tag) => (
              <span
                key={tag.name}
                className="inline-flex items-center gap-1 px-2 py-0.5 text-xs text-zinc-500 bg-zinc-900/50 rounded hover:bg-zinc-800/50 hover:text-zinc-400 cursor-pointer transition-colors"
              >
                #{tag.name}
                <span className="text-zinc-600">{tag.count}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 底部操作 */}
      <div className="p-3 border-t border-zinc-800/50">
        <button className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs text-zinc-400 bg-zinc-900/50 rounded hover:bg-zinc-800/50 transition-colors">
          <Plus className="w-3.5 h-3.5" />
          <span>新建笔记</span>
        </button>
      </div>
    </aside>
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
    <aside className="w-80 h-full border-l border-zinc-800/50 bg-zinc-950/80 flex flex-col">
      {/* 头部 */}
      <div className="p-4 flex items-center justify-between border-b border-zinc-800/50">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span className="text-sm font-medium text-zinc-300">AI 协作</span>
        </div>
        <button 
          onClick={onClose}
          className="p-1 hover:bg-zinc-800 rounded transition-colors"
        >
          <ChevronRight className="w-4 h-4 text-zinc-500" />
        </button>
      </div>

      {/* 内容 */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-4">
          {/* 状态卡片 */}
          <div className="p-3 rounded-lg bg-zinc-900/50 border border-zinc-800/50">
            <div className="flex items-center gap-2 mb-2">
              <StatusIndicator status={status} progress={progress} />
            </div>
            <p className="text-xs text-zinc-500">
              AI 正在分析您的笔记，提取关键信息并生成向量嵌入。
            </p>
          </div>

          {/* 快捷操作 */}
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
              快捷操作
            </h4>
            <div className="space-y-1">
              {[
                { label: '生成摘要', shortcut: 'Ctrl+Shift+S' },
                { label: '提取标签', shortcut: 'Ctrl+Shift+T' },
                { label: '关联图谱', shortcut: 'Ctrl+Shift+G' },
                { label: '语义搜索', shortcut: 'Ctrl+K' },
              ].map((action) => (
                <button
                  key={action.label}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm text-zinc-400 hover:bg-zinc-800/50 rounded transition-colors"
                >
                  <span>{action.label}</span>
                  <kbd className="px-1.5 py-0.5 text-[10px] text-zinc-600 bg-zinc-900 rounded">
                    {action.shortcut}
                  </kbd>
                </button>
              ))}
            </div>
          </div>

          {/* 知识图谱预览 */}
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
              关联图谱
            </h4>
            <div className="h-40 rounded-lg bg-zinc-900/50 border border-zinc-800/50 flex items-center justify-center">
              <div className="text-center">
                <Network className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                <p className="text-xs text-zinc-600">
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [aiPanelOpen, setAiPanelOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('networking')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tags] = useState<string[]>(['eBPF', 'Cilium'])
  
  const { status, progress } = useCatPinSave()

  // 快捷键处理
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Shift+A: 打开 AI 面板
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'A') {
        e.preventDefault()
        setAiPanelOpen(prev => !prev)
      }
      
      // Ctrl+\: 切换侧边栏
      if ((e.metaKey || e.ctrlKey) && e.key === '\\') {
        e.preventDefault()
        setSidebarCollapsed(prev => !prev)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // 获取当前分类信息
  const currentCategory = categories.find(c => c.id === selectedCategory)

  return (
    <div className="flex h-screen w-screen bg-zinc-950 text-zinc-200 font-sans antialiased selection:bg-cyan-500/20">
      {/* 左侧导航 */}
      <Sidebar
        isCollapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(prev => !prev)}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

      {/* 中间主内容区 */}
      <main className="flex-1 flex flex-col h-full bg-zinc-950 min-w-0">
        {/* 顶部状态条 */}
        <header className="h-11 border-b border-zinc-800/30 flex items-center justify-between px-6 text-xs text-zinc-500">
          <div className="flex items-center gap-4">
            {/* 侧边栏切换按钮 */}
            {sidebarCollapsed && (
              <button 
                onClick={() => setSidebarCollapsed(false)}
                className="p-1 hover:bg-zinc-800 rounded transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
            
            {/* 面包屑导航 */}
            <div className="flex items-center gap-2">
              <span className="text-zinc-600">~/Vault</span>
              <span className="text-zinc-700">/</span>
              <span className="text-zinc-400">{currentCategory?.name || 'Networking'}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Ollama 状态 */}
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span>Ollama 就绪</span>
            </div>
            
            {/* AI 面板切换 */}
            <button
              onClick={() => setAiPanelOpen(prev => !prev)}
              className={cn(
                'p-1.5 rounded transition-colors',
                aiPanelOpen ? 'bg-zinc-800 text-zinc-300' : 'hover:bg-zinc-800/50'
              )}
            >
              <Sparkles className="w-3.5 h-3.5" />
            </button>
          </div>
        </header>

        {/* 编辑器区域 */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-8 py-10">
            {/* 标题输入 */}
            <input
              type="text"
              placeholder="无标题主题"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-3xl font-bold bg-transparent text-zinc-100 placeholder-zinc-700 focus:outline-none mb-6"
            />

            {/* 标签 */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-2.5 py-0.5 text-xs text-zinc-400 bg-zinc-900/50 rounded-full border border-zinc-800/50"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* TipTap 编辑器 */}
            <CatPinEditor
              content={content}
              onChange={setContent}
              placeholder="开始记录你的思维碎片，按下 Ctrl+S 让 AI 接管隐喻..."
              height="auto"
              className="border-0 bg-transparent"
            />
          </div>
        </div>

        {/* 底部状态栏 */}
        <footer className="h-10 px-6 border-t border-zinc-800/30 flex items-center justify-between text-xs text-zinc-600">
          <div className="flex items-center gap-4">
            <span>
              字数: {content.replace(/<[^>]*>/g, '').length}
            </span>
            <span className="text-zinc-700">|</span>
            <span>
              词数: {content.replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean).length}
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            {tags.length > 0 && (
              <span>
                Tags: <span className="text-zinc-400">#{tags.join(' #')}</span>
              </span>
            )}
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