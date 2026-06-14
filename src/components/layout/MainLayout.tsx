import { useState, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { CatPinEditor } from '@/components/editor/CatPinEditor'
import { useCatPinSave, SaveStatus } from '@/hooks/useCatPinSave'
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Search, 
  Hash,
  Folder,
  Sparkles,
  Network,
  X
} from 'lucide-react'

// ============================================================
// 类型定义
// ============================================================

interface Category {
  id: string
  name: string
}

interface Tag {
  name: string
  count: number
}

// ============================================================
// 模拟数据
// ============================================================

const allCategories: Category[] = [
  { id: 'networking', name: 'Networking' },
  { id: 'kernel', name: 'Kernel' },
  { id: 'database', name: 'Database' },
  { id: 'systems', name: 'Systems' },
  { id: 'security', name: 'Security' },
  { id: 'programming', name: 'Programming' },
  { id: 'devops', name: 'DevOps' },
  { id: 'ai', name: 'AI' },
]

const allTags: Tag[] = [
  { name: 'rust', count: 45 },
  { name: 'linux', count: 38 },
  { name: 'tcp/ip', count: 29 },
  { name: 'security', count: 27 },
  { name: 'database', count: 24 },
  { name: 'performance', count: 22 },
  { name: 'networking', count: 20 },
  { name: 'kernel', count: 18 },
  { name: 'ebpf', count: 15 },
  { name: 'cilium', count: 12 },
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
// 左侧搜索组件
// ============================================================

function Sidebar({ 
  isCollapsed, 
  onToggle,
  selectedCategory,
  onSelectCategory,
  selectedTags,
  onToggleTag
}: { 
  isCollapsed: boolean
  onToggle: () => void
  selectedCategory: string
  onSelectCategory: (id: string) => void
  selectedTags: string[]
  onToggleTag: (tag: string) => void
}) {
  const [categoryQuery, setCategoryQuery] = useState('')
  const [tagQuery, setTagQuery] = useState('')
  const categoryInputRef = useRef<HTMLInputElement>(null)
  const tagInputRef = useRef<HTMLInputElement>(null)

  // 过滤分类
  const filteredCategories = allCategories.filter(cat => 
    cat.name.toLowerCase().includes(categoryQuery.toLowerCase())
  )

  // 过滤标签
  const filteredTags = allTags.filter(tag => 
    tag.name.toLowerCase().includes(tagQuery.toLowerCase())
  )

  // 快捷键聚焦搜索框
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K: 聚焦分类搜索
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        categoryInputRef.current?.focus()
      }
      // Ctrl+L: 聚焦标签搜索
      if ((e.metaKey || e.ctrlKey) && e.key === 'l') {
        e.preventDefault()
        tagInputRef.current?.focus()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <aside 
      className={cn(
        'h-full border-r border-zinc-800/30 bg-zinc-950/80 flex flex-col transition-all duration-300',
        isCollapsed ? 'w-0 overflow-hidden' : 'w-56'
      )}
    >
      {/* Logo */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-zinc-800 flex items-center justify-center">
            <Sparkles className="w-3 h-3 text-zinc-400" />
          </div>
          <span className="text-xs font-medium text-zinc-400 tracking-wider">AICATPIN</span>
        </div>
        <button 
          onClick={onToggle}
          className="p-1 hover:bg-zinc-800/50 rounded transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5 text-zinc-600" />
        </button>
      </div>

      {/* 搜索区域 */}
      <div className="flex-1 overflow-y-auto px-3 space-y-4">
        {/* 分类搜索 */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-medium text-zinc-600 uppercase tracking-wider">
              分类
            </span>
            <kbd className="px-1 py-0.5 text-[9px] text-zinc-700 bg-zinc-900 rounded">
              Ctrl+K
            </kbd>
          </div>
          
          <div className="relative mb-2">
            <Search className="absolute left-2 top-2 h-3 w-3 text-zinc-600" />
            <input
              ref={categoryInputRef}
              type="text"
              placeholder="搜索分类..."
              value={categoryQuery}
              onChange={(e) => setCategoryQuery(e.target.value)}
              className="w-full pl-7 pr-2 py-1.5 text-xs bg-zinc-900/30 text-zinc-300 placeholder-zinc-700 focus:outline-none focus:bg-zinc-900/50 rounded"
            />
          </div>
          
          <div className="space-y-0.5">
            {filteredCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => onSelectCategory(category.id)}
                className={cn(
                  'w-full flex items-center gap-2 px-2 py-1 rounded text-xs transition-colors',
                  selectedCategory === category.id
                    ? 'bg-zinc-800/50 text-zinc-200'
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/30'
                )}
              >
                <Folder className="w-3 h-3" />
                <span>{category.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 标签搜索 */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-medium text-zinc-600 uppercase tracking-wider">
              标签
            </span>
            <kbd className="px-1 py-0.5 text-[9px] text-zinc-700 bg-zinc-900 rounded">
              Ctrl+L
            </kbd>
          </div>
          
          <div className="relative mb-2">
            <Hash className="absolute left-2 top-2 h-3 w-3 text-zinc-600" />
            <input
              ref={tagInputRef}
              type="text"
              placeholder="搜索标签..."
              value={tagQuery}
              onChange={(e) => setTagQuery(e.target.value)}
              className="w-full pl-7 pr-2 py-1.5 text-xs bg-zinc-900/30 text-zinc-300 placeholder-zinc-700 focus:outline-none focus:bg-zinc-900/50 rounded"
            />
          </div>
          
          <div className="space-y-0.5">
            {filteredTags.map((tag) => (
              <button
                key={tag.name}
                onClick={() => onToggleTag(tag.name)}
                className={cn(
                  'w-full flex items-center justify-between px-2 py-1 rounded text-xs transition-colors',
                  selectedTags.includes(tag.name)
                    ? 'bg-zinc-800/50 text-zinc-200'
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/30'
                )}
              >
                <div className="flex items-center gap-2">
                  <Hash className="w-3 h-3" />
                  <span>{tag.name}</span>
                </div>
                <span className="text-zinc-700">{tag.count}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 底部操作 */}
      <div className="p-3 border-t border-zinc-800/30">
        <button className="w-full flex items-center justify-center gap-2 px-3 py-1.5 text-xs text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/30 rounded transition-colors">
          <Plus className="w-3 h-3" />
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [aiPanelOpen, setAiPanelOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('programming')
  const [selectedTags, setSelectedTags] = useState<string[]>(['rust', 'systems'])
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
      
      // Ctrl+\: 切换侧边栏
      if ((e.metaKey || e.ctrlKey) && e.key === '\\') {
        e.preventDefault()
        setSidebarCollapsed(prev => !prev)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // 切换标签
  const handleToggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }

  // 获取当前分类信息
  const currentCategory = allCategories.find(c => c.id === selectedCategory)

  return (
    <div className="flex h-screen w-screen bg-zinc-950 text-zinc-200 font-sans antialiased selection:bg-cyan-500/20">
      {/* 左侧搜索栏 */}
      <Sidebar
        isCollapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(prev => !prev)}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        selectedTags={selectedTags}
        onToggleTag={handleToggleTag}
      />

      {/* 中间主内容区 */}
      <main className="flex-1 flex flex-col h-full bg-zinc-950 min-w-0">
        {/* 顶部状态条 */}
        <header className="h-10 border-b border-zinc-800/20 flex items-center justify-between px-6 text-xs text-zinc-600">
          <div className="flex items-center gap-3">
            {/* 侧边栏切换按钮 */}
            {sidebarCollapsed && (
              <button 
                onClick={() => setSidebarCollapsed(false)}
                className="p-1 hover:bg-zinc-800/50 rounded transition-colors"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
            
            {/* 扁平路径 */}
            <div className="flex items-center gap-1.5">
              <span className="text-zinc-500">/</span>
              <span className="text-zinc-400">{currentCategory?.name || 'Programming'}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
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
              placeholder="无标题主题"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-2xl font-bold bg-transparent text-zinc-100 placeholder-zinc-700 focus:outline-none mb-4"
            />

            {/* 标签 - 竖向排列 */}
            {selectedTags.length > 0 && (
              <div className="flex flex-col items-start gap-1.5 mb-8">
                {selectedTags.map((tag) => (
                  <div
                    key={tag}
                    className="flex items-center gap-1.5 group"
                  >
                    <span className="text-xs text-zinc-600">#</span>
                    <span className="text-xs text-zinc-400">{tag}</span>
                    <button
                      onClick={() => handleToggleTag(tag)}
                      className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-zinc-800/50 rounded transition-all"
                    >
                      <X className="w-2.5 h-2.5 text-zinc-600" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* TipTap 编辑器 */}
            <CatPinEditor
              content={content}
              onChange={setContent}
              placeholder="开始记录你的思维碎片..."
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