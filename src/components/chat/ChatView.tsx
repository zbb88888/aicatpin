import { useState, useRef, useEffect, useCallback } from 'react'
import { useAppRouter } from '@/stores/appRouter'
import { streamChat } from '@/services/ai'
import { Sparkles, Pin, Send, ArrowLeft } from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

export function ChatView() {
  const { shuttlePayload, pinToEditor, switchView, clearShuttlePayload } = useAppRouter()
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

  // 处理从编辑器穿梭过来的内容 — 自动填入输入框
  useEffect(() => {
    if (shuttlePayload && !shuttlePayload.title) {
      // pinToChat 的 payload 没有 title，说明是从编辑器穿梭过来的
      setInput(shuttlePayload.content)
      clearShuttlePayload()
    }
  }, [shuttlePayload, clearShuttlePayload])

  // 发送消息（流式）
  const handleSend = useCallback(async () => {
    const text = input.trim()
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

    // 先插入一个空的 assistant 消息占位
    const assistantId = (Date.now() + 1).toString()
    const assistantMessage: Message = {
      id: assistantId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
    }
    setMessages(prev => [...prev, assistantMessage])

    try {
      // 使用流式 API 逐块更新 assistant 消息
      for await (const chunk of streamChat(text)) {
        setMessages(prev =>
          prev.map(m =>
            m.id === assistantId
              ? { ...m, content: m.content + chunk }
              : m
          )
        )
      }
    } catch {
      setMessages(prev =>
        prev.map(m =>
          m.id === assistantId
            ? { ...m, content: '抱歉，AI 服务暂时不可用。' }
            : m
        )
      )
    } finally {
      setIsLoading(false)
    }
  }, [input, isLoading])

  // Pin 到编辑器 — 直接调用 store 的异步 pinToEditor
  const handlePinToEditor = useCallback(async (content: string) => {
    await pinToEditor(content)
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
                  {msg.role === 'assistant' && msg.content && (
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
          {isLoading && messages[messages.length - 1]?.content === '' && (
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
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入问题..."
              disabled={isLoading}
              className="w-full bg-gray-800 text-gray-100 placeholder-gray-600 rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/50 border-none"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
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
