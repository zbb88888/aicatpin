// React is used implicitly by JSX
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { 
  Search, 
  Plus, 
  Settings, 
  Database, 
  Cpu, 
  Network, 
  Shield, 
  Code, 
  Tag,
  Folder,
  FileText,
  Clock,
  Star
} from 'lucide-react'

// 模拟数据 - 扁平分类
const categories = [
  { id: 'networking', name: 'Networking', icon: Network, count: 24 },
  { id: 'kernel', name: 'Kernel', icon: Cpu, count: 18 },
  { id: 'security', name: 'Security', icon: Shield, count: 15 },
  { id: 'programming', name: 'Programming', icon: Code, count: 32 },
  { id: 'database', name: 'Database', icon: Database, count: 12 },
  { id: 'systems', name: 'Systems', icon: Settings, count: 21 },
]

// 模拟数据 - 高频标签
const popularTags = [
  { name: 'rust', color: 'cyber', count: 45 },
  { name: 'linux', color: 'cyber', count: 38 },
  { name: 'tcp/ip', color: 'magenta', count: 29 },
  { name: 'security', color: 'cyber', count: 27 },
  { name: 'database', color: 'magenta', count: 24 },
  { name: 'performance', color: 'cyber', count: 22 },
  { name: 'networking', color: 'magenta', count: 20 },
  { name: 'kernel', color: 'cyber', count: 18 },
  { name: 'async', color: 'magenta', count: 16 },
  { name: 'memory', color: 'cyber', count: 14 },
]

// 模拟数据 - 最近笔记
const recentNotes = [
  { id: '1', title: 'TCP/IP 协议栈深度解析', category: 'Networking', tags: ['tcp/ip', 'networking'], updated: '2 小时前' },
  { id: '2', title: 'Rust 内存安全机制', category: 'Programming', tags: ['rust', 'memory'], updated: '5 小时前' },
  { id: '3', title: 'Linux 内核调度器', category: 'Kernel', tags: ['linux', 'kernel', 'performance'], updated: '1 天前' },
  { id: '4', title: 'PostgreSQL 索引优化', category: 'Database', tags: ['database', 'performance'], updated: '2 天前' },
]

export function MainLayout() {
  return (
    <div className="h-screen flex bg-background text-foreground cyber-gradient">
      {/* 左栏 - 分类和标签 */}
      <aside className="w-[250px] border-r border-cyan-500/20 flex flex-col bg-card/50 backdrop-blur-sm">
        {/* Logo 区域 */}
        <div className="p-4 border-b border-cyan-500/20">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
              <Cpu className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h1 className="font-bold text-lg cyber-text">AICatPin</h1>
              <p className="text-xs text-cyan-400/60">AI-Native Knowledge IDE</p>
            </div>
          </div>
        </div>

        {/* 搜索栏 */}
        <div className="p-4 border-b border-cyan-500/20">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-cyan-400/60" />
            <Input 
              placeholder="搜索笔记..." 
              className="pl-10 bg-cyan-500/5 border-cyan-500/30 focus:border-cyan-500/50 focus:ring-cyan-500/20"
            />
          </div>
        </div>

        {/* 分类列表 */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-cyan-400/80 uppercase tracking-wider">
                  Categories
                </h2>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-1">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-cyan-500/10 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <category.icon className="w-4 h-4 text-cyan-400/60 group-hover:text-cyan-400 transition-colors" />
                      <span className="text-sm">{category.name}</span>
                    </div>
                    <Badge variant="cyber" className="text-xs">
                      {category.count}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* 高频标签云 */}
            <div className="p-4 border-t border-cyan-500/20">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-cyan-400/80 uppercase tracking-wider">
                  Popular Tags
                </h2>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <Tag className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {popularTags.map((tag) => (
                  <Badge
                    key={tag.name}
                    variant={tag.color === 'cyber' ? 'cyber' : 'magenta'}
                    className="cursor-pointer hover:scale-105 transition-transform"
                  >
                    {tag.name}
                    <span className="ml-1 opacity-60">({tag.count})</span>
                  </Badge>
                ))}
              </div>
            </div>

            {/* 最近笔记 */}
            <div className="p-4 border-t border-cyan-500/20">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-cyan-400/80 uppercase tracking-wider">
                  Recent Notes
                </h2>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <Clock className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-2">
                {recentNotes.map((note) => (
                  <div
                    key={note.id}
                    className="p-2 rounded-lg hover:bg-cyan-500/10 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{note.title}</p>
                        <p className="text-xs text-cyan-400/60 mt-1">
                          {note.category} • {note.updated}
                        </p>
                      </div>
                      <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100">
                        <Star className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </ScrollArea>
        </div>

        {/* 底部操作栏 */}
        <div className="p-4 border-t border-cyan-500/20">
          <Button variant="cyber" className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            新建笔记
          </Button>
        </div>
      </aside>

      {/* 中栏 - 编辑器主舞台 */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* 顶部工具栏 */}
        <header className="h-14 border-b border-cyan-500/20 flex items-center justify-between px-6 bg-card/30 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Folder className="w-4 h-4 text-cyan-400/60" />
              <span className="text-sm text-cyan-400/80">Networking</span>
            </div>
            <span className="text-cyan-500/30">/</span>
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-cyan-400/60" />
              <span className="text-sm font-medium">TCP/IP 协议栈深度解析</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              设置
            </Button>
            <Button variant="cyber" size="sm">
              保存
            </Button>
          </div>
        </header>

        {/* 编辑器区域 */}
        <div className="flex-1 p-6 overflow-auto">
          <div className="max-w-4xl mx-auto">
            {/* 编辑器占位符 */}
            <div className="min-h-[600px] border border-cyan-500/20 rounded-lg bg-card/50 backdrop-blur-sm p-8">
              <div className="mb-8">
                <h1 className="text-3xl font-bold cyber-text mb-4">
                  TCP/IP 协议栈深度解析
                </h1>
                <div className="flex items-center gap-4 text-sm text-cyan-400/60">
                  <span>创建于 2024-01-15</span>
                  <span>•</span>
                  <span>最后更新 2 小时前</span>
                  <span>•</span>
                  <span>字数 2,847</span>
                </div>
                <div className="flex gap-2 mt-4">
                  <Badge variant="cyber">tcp/ip</Badge>
                  <Badge variant="magenta">networking</Badge>
                  <Badge variant="cyber">protocol</Badge>
                </div>
              </div>
              
              {/* 编辑器内容占位 */}
              <div className="space-y-6 text-foreground/80">
                <p>
                  在现代网络通信中，TCP/IP 协议栈扮演着至关重要的角色。它是互联网的基础，
                  定义了数据如何在网络中传输、路由和接收。
                </p>
                <h2 className="text-2xl font-semibold text-cyan-400 mt-8 mb-4">
                  1. 协议栈概述
                </h2>
                <p>
                  TCP/IP 协议栈通常分为四层：应用层、传输层、网络层和链路层。每一层都有
                  其特定的功能和协议。
                </p>
                <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-lg p-4 my-6">
                  <p className="text-sm text-cyan-400/80">
                    💡 提示：使用 TipTap 编辑器可以轻松创建这样的富文本内容块。
                  </p>
                </div>
                <h2 className="text-2xl font-semibold text-cyan-400 mt-8 mb-4">
                  2. 传输层协议
                </h2>
                <p>
                  传输层主要包含两个协议：TCP（传输控制协议）和 UDP（用户数据报协议）。
                  TCP 提供可靠的、面向连接的服务，而 UDP 则提供无连接的服务。
                </p>
                <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-lg p-4 my-6">
                  <pre className="text-sm font-mono text-cyan-300">
{`// TCP 连接建立过程
客户端 -> SYN -> 服务器
客户端 <- SYN-ACK <- 服务器
客户端 -> ACK -> 服务器`}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 右栏 - 知识图谱占位符 */}
      <aside className="w-[300px] border-l border-cyan-500/20 flex flex-col bg-card/50 backdrop-blur-sm">
        {/* 图谱标题 */}
        <div className="p-4 border-b border-cyan-500/20">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-cyan-400/80 uppercase tracking-wider">
              Knowledge Graph
            </h2>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* 图谱占位区域 */}
        <div className="flex-1 p-4">
          <div className="h-full border-2 border-dashed border-cyan-500/30 rounded-lg flex flex-col items-center justify-center bg-cyan-500/5">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-cyan-500/10 flex items-center justify-center">
                <Network className="w-8 h-8 text-cyan-400/60" />
              </div>
              <h3 className="text-lg font-semibold text-cyan-400/80 mb-2">
                Knowledge Graph
              </h3>
              <p className="text-sm text-cyan-400/60 max-w-[200px] mx-auto">
                可视化笔记之间的关联关系
              </p>
              <div className="mt-6 space-y-2">
                <div className="flex items-center gap-2 text-xs text-cyan-400/40">
                  <div className="w-2 h-2 rounded-full bg-cyan-400/30"></div>
                  <span>节点: 笔记、概念、标签</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-cyan-400/40">
                  <div className="w-2 h-2 rounded-full bg-fuchsia-400/30"></div>
                  <span>边: 引用、相似、关联</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 图谱控制面板 */}
        <div className="p-4 border-t border-cyan-500/20">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-cyan-400/60">节点数量</span>
              <span className="text-cyan-400">156</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-cyan-400/60">连接数量</span>
              <span className="text-cyan-400">342</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-cyan-400/60">聚类系数</span>
              <span className="text-cyan-400">0.73</span>
            </div>
          </div>
          
          <div className="mt-4">
            <Button variant="cyberOutline" className="w-full" size="sm">
              生成图谱
            </Button>
          </div>
        </div>
      </aside>
    </div>
  )
}