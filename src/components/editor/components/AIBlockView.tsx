import React, { useState, useCallback, useEffect, useRef } from 'react'
import { NodeViewWrapper } from '@tiptap/react'
import { Node as ProseMirrorNode } from 'prosemirror-model'
import { Editor } from '@tiptap/core'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Sparkles, 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Trash2,
  Copy,
  Check
} from 'lucide-react'

// AI 块状态类型
type AIBlockStatus = 'idle' | 'loading' | 'streaming' | 'complete' | 'error'

// AI 块属性
interface AIBlockAttrs {
  status: AIBlockStatus
  prompt: string
  content: string
  error?: string
  model?: string
  timestamp?: number
}

// 组件属性
interface AIBlockViewProps {
  node: ProseMirrorNode
  editor: Editor
  getPos: () => number
  updateAttributes: (attrs: Record<string, any>) => void
  deleteNode: () => void
  selected: boolean
}

// 状态图标映射
const statusIcons: Record<AIBlockStatus, React.ReactNode> = {
  idle: <Sparkles className="w-4 h-4" />,
  loading: <Loader2 className="w-4 h-4 animate-spin" />,
  streaming: <Loader2 className="w-4 h-4 animate-pulse" />,
  complete: <CheckCircle2 className="w-4 h-4 text-green-400" />,
  error: <XCircle className="w-4 h-4 text-red-400" />,
}

// 状态文本映射
const statusTexts: Record<AIBlockStatus, string> = {
  idle: 'AI 助手',
  loading: '正在思考...',
  streaming: '正在生成...',
  complete: '生成完成',
  error: '生成失败',
}

export function AIBlockView({
  node,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  editor: _editor,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getPos: _getPos,
  updateAttributes,
  deleteNode,
  selected,
}: AIBlockViewProps) {
  const { status, prompt, content, error, model } = node.attrs as AIBlockAttrs
  const [inputValue, setInputValue] = useState(prompt)
  const [isEditing, setIsEditing] = useState(!prompt)
  const [copied, setCopied] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // 自动聚焦输入框
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isEditing])

  // 模拟 AI 生成
  const simulateGeneration = useCallback(async () => {
    if (!inputValue.trim()) return

    // 更新提示词
    updateAttributes({
      prompt: inputValue,
      status: 'loading',
      content: '',
      error: undefined,
    })

    // 模拟加载延迟
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // 模拟流式输出
    updateAttributes({ status: 'streaming' })

    const simulatedResponse = `这是 AI 生成的内容示例。

基于您的提示："${inputValue}"

以下是生成的内容：

## 分析结果

1. **主要观点**：这是一个模拟的 AI 响应，用于展示 TipTap 编辑器中的 AI 块功能。

2. **技术细节**：
   - 使用了 React 组件渲染
   - 支持流式输出效果
   - 集成了 Ollama API（待实现）

3. **下一步**：
   - 连接真实的 Ollama API
   - 实现流式响应处理
   - 添加更多 AI 功能

---

*此内容由 AI 生成，仅供参考。*`

    // 模拟逐字输出
    let currentContent = ''
    for (let i = 0; i < simulatedResponse.length; i++) {
      currentContent += simulatedResponse[i]
      updateAttributes({ content: currentContent })
      await new Promise((resolve) => setTimeout(resolve, 20))
    }

    // 完成
    updateAttributes({
      status: 'complete',
      timestamp: Date.now(),
    })
    setIsEditing(false)
  }, [inputValue, updateAttributes])

  // 处理提交
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (inputValue.trim()) {
        simulateGeneration()
      }
    },
    [inputValue, simulateGeneration]
  )

  // 处理键盘事件
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSubmit(e)
      }
      if (e.key === 'Escape') {
        if (!prompt) {
          deleteNode()
        } else {
          setIsEditing(false)
        }
      }
    },
    [handleSubmit, prompt, deleteNode]
  )

  // 复制内容
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }, [content])

  // 重新生成
  const handleRegenerate = useCallback(() => {
    setIsEditing(true)
    updateAttributes({
      status: 'idle',
      content: '',
      error: undefined,
    })
  }, [updateAttributes])

  // 删除块
  const handleDelete = useCallback(() => {
    deleteNode()
  }, [deleteNode])

  return (
    <NodeViewWrapper
      className={cn(
        'my-4 rounded-lg border transition-all duration-200',
        selected
          ? 'border-cyan-500/50 shadow-[0_0_15px_rgba(0,255,255,0.2)]'
          : 'border-cyan-500/20 hover:border-cyan-500/30',
        'bg-card/50 backdrop-blur-sm'
      )}
      data-type="ai-block"
    >
      {/* 头部 */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-cyan-500/10">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'w-6 h-6 rounded-full flex items-center justify-center',
              status === 'loading' || status === 'streaming'
                ? 'bg-cyan-500/20'
                : status === 'complete'
                ? 'bg-green-500/20'
                : status === 'error'
                ? 'bg-red-500/20'
                : 'bg-cyan-500/10'
            )}
          >
            {statusIcons[status]}
          </div>
          <span className="text-sm font-medium text-cyan-400">
            {statusTexts[status]}
          </span>
          {model && (
            <span className="text-xs text-cyan-400/50 px-2 py-0.5 rounded-full bg-cyan-500/10">
              {model}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {status === 'complete' && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-cyan-400/60 hover:text-cyan-400"
                onClick={handleCopy}
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-cyan-400/60 hover:text-cyan-400"
                onClick={handleRegenerate}
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </Button>
            </>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-cyan-400/60 hover:text-red-400"
            onClick={handleDelete}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="p-4">
        {/* 输入区域 */}
        {isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="relative">
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="输入您的提示，让 AI 帮您生成内容..."
                className="bg-cyan-500/5 border-cyan-500/20 focus:border-cyan-500/40 focus:ring-cyan-500/20 pr-20"
                disabled={status === 'loading' || status === 'streaming'}
              />
              <Button
                type="submit"
                size="sm"
                variant="cyber"
                className="absolute right-1 top-1 h-8"
                disabled={
                  !inputValue.trim() ||
                  status === 'loading' ||
                  status === 'streaming'
                }
              >
                {status === 'loading' || status === 'streaming' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-cyan-400/40">
              按 Enter 发送，Esc 取消
            </p>
          </form>
        ) : (
          <div
            className="text-sm text-foreground/80 leading-relaxed cursor-pointer"
            onClick={() => setIsEditing(true)}
          >
            {prompt && (
              <div className="mb-3 p-2 rounded bg-cyan-500/5 border border-cyan-500/10">
                <p className="text-xs text-cyan-400/60 mb-1">提示词</p>
                <p className="text-cyan-400">{prompt}</p>
              </div>
            )}
          </div>
        )}

        {/* 生成的内容 */}
        {(status === 'streaming' || status === 'complete') && content && (
          <div
            ref={contentRef}
            className={cn(
              'mt-3 p-3 rounded-lg bg-background/50 border border-cyan-500/10',
              'prose prose-sm prose-invert max-w-none',
              'prose-headings:text-cyan-400 prose-headings:font-semibold',
              'prose-p:text-foreground/80 prose-p:leading-relaxed',
              'prose-strong:text-cyan-400 prose-strong:font-semibold',
              'prose-code:text-cyan-300 prose-code:bg-cyan-500/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded',
              'prose-pre:bg-background/80 prose-pre:border prose-pre:border-cyan-500/10',
              'prose-blockquote:border-cyan-500/30 prose-blockquote:text-foreground/70',
              'prose-ul:text-foreground/80 prose-ol:text-foreground/80',
              'prose-li:text-foreground/80',
              'prose-a:text-cyan-400 prose-a:no-underline hover:prose-a:underline',
              'prose-hr:border-cyan-500/20'
            )}
          >
            <div className="whitespace-pre-wrap">{content}</div>
            {status === 'streaming' && (
              <span className="inline-block w-2 h-4 ml-1 bg-cyan-400 animate-pulse" />
            )}
          </div>
        )}

        {/* 错误状态 */}
        {status === 'error' && error && (
          <div className="mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <p className="text-sm text-red-400">{error}</p>
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 text-red-400 hover:text-red-300"
              onClick={handleRegenerate}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              重试
            </Button>
          </div>
        )}

        {/* 空闲状态提示 */}
        {status === 'idle' && !isEditing && !prompt && (
          <div
            className="text-center py-4 text-cyan-400/40 cursor-pointer hover:text-cyan-400/60 transition-colors"
            onClick={() => setIsEditing(true)}
          >
            <Sparkles className="w-6 h-6 mx-auto mb-2" />
            <p className="text-sm">点击开始与 AI 对话</p>
          </div>
        )}
      </div>

      {/* 底部信息 */}
      {status === 'complete' && node.attrs.timestamp && (
        <div className="px-4 py-2 border-t border-cyan-500/10">
          <p className="text-xs text-cyan-400/30">
            生成于 {new Date(node.attrs.timestamp).toLocaleString('zh-CN')}
          </p>
        </div>
      )}
    </NodeViewWrapper>
  )
}