import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { useAppRouter } from '@/stores/appRouter'
import { Sparkles, Pin, Send, ArrowLeft } from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

const OLLAMA_URL = 'http://127.0.0.1:11434'
const OLLAMA_MODEL = 'gemma4:e2b'

async function generateTitle(text: string): Promise<string> {
  try {
    const res = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt: `为以下文本生成一个3-5个字的子主题标题，只返回标题，不要其他内容：\n\n${text.substring(0, 500)}`,
        stream: false,
        options: { temperature: 0.3, num_predict: 20 }
      }),
    })
    if (!res.ok) return text.substring(0, 10).replace(/[#\n]/g, '').trim()
    const data = await res.json()
    return data.response?.trim().replace(/["'""]/g, '') || text.substring(0, 10)
  } catch {
    return text.substring(0, 10).replace(/[#\n]/g, '').trim()
  }
}

async function chatWithAI(messages: Message[]): Promise<string> {
  try {
    const prompt = messages.map(m => `${m.role === 'user' ? '用户' : '助手'}: ${m.content}`).join('\n')
    const res = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt: `你是一个智能助手，用简洁专业的中文回答问题。\n\n${prompt}\n助手:`,
        stream: false,
        options: { temperature: 0.7, num_predict: 1000 }
      }),
    })
    if (!res.ok) throw new Error('AI 请求失败')
    const data = await res.json()
    return data.response?.trim() || '抱歉，无法生成回答。'
  } catch {
    return '抱歉，AI 服务暂时不可用。'
  }
}

export function ChatView() {
  const { shuttleContext, pinToEditor, switchView } = useAppRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // 自动聚焦输入框
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // 处理从编辑器传来的上下文 - 使用 useMemo 计算当前输入值
  const displayInput = useMemo(() => {
    return shuttleContext || input
  }, [shuttleContext, input])

  // 发送消息
  const handleSend = useCallback(async () => {
    const text = displayInput.trim()
    if (!text || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await chatWithAI([...messages, userMessage])
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: Date.now(),
      }
      setMessages(prev => [...prev, assistantMessage])
    } catch {
      // 错误处理
    } finally {
      setIsLoading(false)
    }
  }, [displayInput, isLoading, messages])

  // Pin 到编辑器
  const handlePinToEditor = useCallback(async (content: string) => {
    const title = await generateTitle(content)
    const html = `<h2>${title}</h2>\n${content}`
    pinToEditor(html)
  }, [pinToEditor])

  // 键盘事件
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }, [handleSend])

  return (
    <div className="flex flex-col h-screen bg-[#1a1a1a] text-gray-100">
      {/* Header */}
      <header className="h-12 flex items-center justify-between px-6 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <button
            onClick={() => switchView('editor')}
            className="flex items-center gap-2 text-gray-400 hover:text-gray-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">返回编辑器</span>
          </button>
        </div>
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span className="text-sm font-medium text-gray-300">AI 对话</span>
        </div>
        <div className="w-24" /> {/* 占位 */}
      </header>

      {/* 消息区域 */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.length === 0 ? (
            // 空状态
            <div className="flex flex-col items-center justify-center h-full text-center py-20">
              <div className="w-16 h-16 rounded-2xl bg-gray-800 flex items-center justify-center mb-4">
                <Sparkles className="w-8 h-8 text-emerald-400" />
              </div>
              <p className="text-gray-400 text-lg mb-2">开始对话</p>
              <p className="text-gray-600 text-sm">输入问题，AI 会为你解答</p>
            </div>
          ) : (
            // 消息列表
            messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] ${msg.role === 'user' ? 'order-2' : ''}`}>
                  <div className={`rounded-2xl px-4 py-3 ${
                    msg.role === 'user' 
                      ? 'bg-emerald-600 text-white' 
                      : 'bg-gray-800 text-gray-100'
                  }`}>
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">
                      {msg.content}
                    </div>
                  </div>
                  
                  {/* Pin 按钮 - 仅 AI 回答显示 */}
                  {msg.role === 'assistant' && (
                    <button
                      onClick={() => handlePinToEditor(msg.content)}
                      className="mt-2 flex items-center gap-1.5 text-xs text-gray-500 hover:text-emerald-400 transition-colors"
                    >
                      <Pin className="w-3 h-3" />
                      <span>Pin 到文档</span>
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
          
          {/* 加载指示器 */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-800 rounded-2xl px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                  <span className="text-sm text-gray-400">思考中...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* 输入区域 */}
      <div className="border-t border-gray-800 px-4 py-4">
        <div className="max-w-3xl mx-auto">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={displayInput}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入问题..."
              disabled={isLoading}
              className="w-full bg-gray-800 text-gray-100 placeholder-gray-600 rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/50 border-none"
            />
            <button
              onClick={handleSend}
              disabled={!displayInput.trim() || isLoading}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:text-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ChatView
