import { useState } from 'react'
import { CatPinEditor } from './CatPinEditor'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Database, 
  FolderOpen, 
  Zap, 
  CheckCircle2, 
  XCircle,
  Loader2,
  FileText,
  Tag,
  Folder
} from 'lucide-react'

// 保存历史记录
interface SaveHistory {
  id: string
  title: string
  category: string
  tags: string[]
  timestamp: Date
  success: boolean
  filePath?: string
}

export function SaveDemo() {
  const [saveHistory] = useState<SaveHistory[]>([])
  const [isTestingOllama, setIsTestingOllama] = useState(false)
  const [ollamaStatus, setOllamaStatus] = useState<boolean | null>(null)

  // 测试 Ollama 连接
  const testOllamaConnection = async () => {
    setIsTestingOllama(true)
    try {
      const response = await fetch('http://127.0.0.1:11434/api/tags', {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      })
      setOllamaStatus(response.ok)
    } catch {
      setOllamaStatus(false)
    } finally {
      setIsTestingOllama(false)
    }
  }

  // 保存成功回调
  const handleSaveSuccess = (id: string) => {
    console.log('保存成功:', id)
    // 这里可以添加更多逻辑
  }

  // 保存失败回调
  const handleSaveError = (error: string) => {
    console.error('保存失败:', error)
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold cyber-text">
          保存流程演示
        </h1>
        <p className="text-lg text-cyan-400/60 max-w-2xl mx-auto">
          演示完整的 AI 管道：内容 → AI 提取元数据 → 生成向量 → 保存数据库 → 同步文件系统
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 编辑器区域 */}
        <div className="lg:col-span-3">
          <Card className="border-cyan-500/20 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-cyan-400">
                  编辑器
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={testOllamaConnection}
                    disabled={isTestingOllama}
                  >
                    {isTestingOllama ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Zap className="w-4 h-4 mr-2" />
                    )}
                    测试 Ollama
                  </Button>
                  {ollamaStatus !== null && (
                    <Badge variant={ollamaStatus ? 'cyber' : 'destructive'}>
                      {ollamaStatus ? 'Ollama 连接正常' : 'Ollama 连接失败'}
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[500px]">
                <CatPinEditor
                  onSaveSuccess={handleSaveSuccess}
                  onSaveError={handleSaveError}
                  placeholder="开始编辑内容，然后按 Ctrl+S 保存..."
                  height="100%"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 侧边栏 */}
        <div className="space-y-6">
          {/* 流程说明 */}
          <Card className="border-cyan-500/20 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg text-cyan-400">
                保存流程
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-cyan-400">1</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">AI 提取元数据</h4>
                    <p className="text-xs text-cyan-400/60">
                      使用 Ollama qwen2.5:7b 提取标题、分类、标签、摘要
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-cyan-400">2</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">生成向量嵌入</h4>
                    <p className="text-xs text-cyan-400/60">
                      使用 nomic-embed-text 生成 1024 维向量
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-cyan-400">3</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">保存到 Supabase</h4>
                    <p className="text-xs text-cyan-400/60">
                      插入 knowledge_vault 表
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-cyan-400">4</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">同步到文件系统</h4>
                    <p className="text-xs text-cyan-400/60">
                      保存为 Markdown + YAML Front-matter
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 文件路径说明 */}
          <Card className="border-cyan-500/20 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg text-cyan-400">
                文件路径
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <FolderOpen className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm font-mono">~/AICatPin_Vault/</span>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Folder className="w-4 h-4 text-cyan-400/60" />
                  <span className="text-sm font-mono text-cyan-400/60">{'{category}/'}</span>
                </div>
                <div className="flex items-center gap-2 ml-8">
                  <FileText className="w-4 h-4 text-cyan-400/60" />
                  <span className="text-sm font-mono text-cyan-400/60">{'{title}.md'}</span>
                </div>
              </div>
              <div className="mt-4 p-3 rounded bg-cyan-500/5 border border-cyan-500/10">
                <p className="text-xs text-cyan-400/60">
                  文件格式：Markdown + YAML Front-matter，包含完整元数据
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 技术栈 */}
          <Card className="border-cyan-500/20 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg text-cyan-400">
                技术栈
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm">PostgreSQL + pgvector</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm">Ollama (qwen2.5:7b)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm">nomic-embed-text</span>
                </div>
                <div className="flex items-center gap-2">
                  <FolderOpen className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm">Tauri Rust</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 保存历史 */}
          <Card className="border-cyan-500/20 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg text-cyan-400">
                保存历史
              </CardTitle>
            </CardHeader>
            <CardContent>
              {saveHistory.length === 0 ? (
                <p className="text-sm text-cyan-400/40 text-center py-4">
                  暂无保存记录
                </p>
              ) : (
                <div className="space-y-2">
                  {saveHistory.slice(0, 5).map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-2 p-2 rounded bg-cyan-500/5"
                    >
                      {item.success ? (
                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-400" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{item.title}</p>
                        <p className="text-xs text-cyan-400/40">
                          {item.category} • {item.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 使用说明 */}
      <Card className="border-cyan-500/20 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg text-cyan-400">
            使用说明
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-semibold text-cyan-400">前置条件</h4>
              <ul className="space-y-2 text-sm text-cyan-400/60">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 text-green-400" />
                  <span>Ollama 服务运行在 http://127.0.0.1:11434</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 text-green-400" />
                  <span>已下载 qwen2.5:7b 模型</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 text-green-400" />
                  <span>已下载 nomic-embed-text 模型</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 text-green-400" />
                  <span>Supabase 本地实例运行中</span>
                </li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold text-cyan-400">操作步骤</h4>
              <ol className="space-y-2 text-sm text-cyan-400/60">
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0 text-xs">
                    1
                  </span>
                  <span>在编辑器中输入内容</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0 text-xs">
                    2
                  </span>
                  <span>按 Ctrl+S 或点击保存按钮</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0 text-xs">
                    3
                  </span>
                  <span>等待 AI 处理完成</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0 text-xs">
                    4
                  </span>
                  <span>查看保存结果和文件路径</span>
                </li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default SaveDemo