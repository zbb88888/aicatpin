import { useState } from 'react'
import { CatPinEditor } from './CatPinEditor'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Sparkles, Code, FileText, Zap } from 'lucide-react'

export function EditorDemo() {
  const [content, setContent] = useState<string>('')
  const [savedContent, setSavedContent] = useState<string>('')

  const handleSave = (content: string) => {
    setSavedContent(content)
    console.log('保存内容:', content)
  }

  const sampleContent = `
<h1>CatPin Editor 演示</h1>
<p>这是一个基于 TipTap 的现代化富文本编辑器，专为 AICatPin 设计。</p>

<h2>✨ 主要特性</h2>
<ul>
  <li><strong>无头架构</strong> - 完全可定制的 UI</li>
  <li><strong>斜杠命令</strong> - 输入 <code>/</code> 打开命令菜单</li>
  <li><strong>AI 集成</strong> - 使用 <code>/ai</code> 生成内容</li>
  <li><strong>代码高亮</strong> - 支持多种编程语言</li>
</ul>

<h2>📝 示例代码</h2>
<pre><code class="language-javascript">function hello() {
  console.log("Hello, AICatPin!");
  return "Welcome to the future of note-taking";
}</code></pre>

<h2>💡 使用提示</h2>
<blockquote>
  <p>尝试在编辑器中输入 <code>/</code> 来查看可用的命令列表。选择 <code>/ai</code> 可以插入 AI 助手块。</p>
</blockquote>

<p>按 <code>Ctrl+S</code> 可以保存当前内容。</p>
`

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold cyber-text">
          CatPin Editor
        </h1>
        <p className="text-lg text-cyan-400/60 max-w-2xl mx-auto">
          基于 TipTap 的现代化富文本编辑器，专为 AICatPin 的 AI 原生知识管理设计
        </p>
        
        <div className="flex justify-center gap-4">
          <Badge variant="cyber" className="px-4 py-2">
            <Sparkles className="w-4 h-4 mr-2" />
            AI 集成
          </Badge>
          <Badge variant="magenta" className="px-4 py-2">
            <Code className="w-4 h-4 mr-2" />
            代码高亮
          </Badge>
          <Badge variant="cyber" className="px-4 py-2">
            <FileText className="w-4 h-4 mr-2" />
            Markdown 支持
          </Badge>
          <Badge variant="magenta" className="px-4 py-2">
            <Zap className="w-4 h-4 mr-2" />
            斜杠命令
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 编辑器演示 */}
        <div className="lg:col-span-2">
          <Card className="border-cyan-500/20 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-cyan-400">
                  编辑器演示
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setContent(sampleContent)}
                  >
                    加载示例
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setContent('')}
                  >
                    清空
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[600px]">
                <CatPinEditor
                  content={content}
                  onChange={setContent}
                  onSave={handleSave}
                  placeholder="开始编辑，或输入 / 打开命令菜单..."
                  height="100%"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 侧边栏 */}
        <div className="space-y-6">
          {/* 功能说明 */}
          <Card className="border-cyan-500/20 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg text-cyan-400">
                快捷键说明
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-cyan-400/60">斜杠命令</span>
                  <kbd className="px-2 py-1 rounded bg-cyan-500/10 border border-cyan-500/20 text-xs">
                    /
                  </kbd>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-cyan-400/60">AI 块</span>
                  <kbd className="px-2 py-1 rounded bg-cyan-500/10 border border-cyan-500/20 text-xs">
                    Ctrl+Shift+A
                  </kbd>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-cyan-400/60">保存</span>
                  <kbd className="px-2 py-1 rounded bg-cyan-500/10 border border-cyan-500/20 text-xs">
                    Ctrl+S
                  </kbd>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-cyan-400/60">撤销</span>
                  <kbd className="px-2 py-1 rounded bg-cyan-500/10 border border-cyan-500/20 text-xs">
                    Ctrl+Z
                  </kbd>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-cyan-400/60">重做</span>
                  <kbd className="px-2 py-1 rounded bg-cyan-500/10 border border-cyan-500/20 text-xs">
                    Ctrl+Shift+Z
                  </kbd>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 斜杠命令列表 */}
          <Card className="border-cyan-500/20 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg text-cyan-400">
                斜杠命令
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[
                  { icon: '¶', name: '文本', desc: '普通段落' },
                  { icon: 'H1', name: '标题 1', desc: '大标题' },
                  { icon: 'H2', name: '标题 2', desc: '中标题' },
                  { icon: 'H3', name: '标题 3', desc: '小标题' },
                  { icon: '•', name: '无序列表', desc: '项目符号' },
                  { icon: '1.', name: '有序列表', desc: '编号列表' },
                  { icon: '❝', name: '引用', desc: '引用块' },
                  { icon: '⟨⟩', name: '代码块', desc: '代码片段' },
                  { icon: '—', name: '分割线', desc: '水平分割线' },
                  { icon: '🤖', name: 'AI 助手', desc: '生成内容' },
                ].map((cmd) => (
                  <div
                    key={cmd.name}
                    className="flex items-center gap-3 p-2 rounded hover:bg-cyan-500/10 transition-colors"
                  >
                    <div className="w-8 h-8 rounded bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-sm">
                      {cmd.icon}
                    </div>
                    <div>
                      <div className="text-sm font-medium">{cmd.name}</div>
                      <div className="text-xs text-cyan-400/50">{cmd.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 保存的内容预览 */}
          {savedContent && (
            <Card className="border-cyan-500/20 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg text-cyan-400">
                  保存的内容
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-3 rounded bg-cyan-500/5 border border-cyan-500/10 max-h-40 overflow-auto">
                  <pre className="text-xs text-cyan-400/60 whitespace-pre-wrap break-words">
                    {savedContent}
                  </pre>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* 技术说明 */}
      <Card className="border-cyan-500/20 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg text-cyan-400">
            技术架构
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <h4 className="font-semibold text-cyan-400">无头架构</h4>
              <p className="text-sm text-cyan-400/60">
                使用 TipTap 的无头模式，完全控制 UI 外观。结合 Tailwind CSS 实现赛博朋克风格。
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-cyan-400">扩展系统</h4>
              <p className="text-sm text-cyan-400/60">
                自定义 SlashCommand 和 AIBlock 扩展，支持斜杠命令菜单和 AI 内容生成。
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-cyan-400">AI 集成</h4>
              <p className="text-sm text-cyan-400/60">
                预留 Ollama API 接口，支持流式输出和实时预览。使用本地 AI 模型生成内容。
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default EditorDemo