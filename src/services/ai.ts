/**
 * AI 引擎通信层
 * 封装与 Ollama API 的通信，支持流式和非流式请求
 */

const OLLAMA_URL = 'http://127.0.0.1:11434'
const OLLAMA_MODEL = 'gemma4:e2b'

interface StreamChunk {
  done: boolean
  response?: string
  error?: string
}

/**
 * 流式对话 - 用于 Chat 视图
 * @param prompt 用户输入的提示
 * @param context 上下文信息（可选）
 * @returns 异步生成器，逐块返回 AI 的响应
 */
export async function* streamChat(
  prompt: string,
  context?: string
): AsyncGenerator<string, void, unknown> {
  const messages = []
  
  // 如果有上下文，添加系统消息
  if (context) {
    messages.push(`上下文：${context}`)
  }
  
  messages.push(`用户：${prompt}`)
  messages.push('助手：')
  
  try {
    const response = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt: `你是一个智能助手，用简洁专业的中文回答问题。\n\n${messages.join('\n')}`,
        stream: true,
        options: {
          temperature: 0.7,
          num_predict: 1000
        }
      })
    })
    
    if (!response.ok) {
      throw new Error(`AI 请求失败: ${response.status}`)
    }
    
    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('无法读取响应流')
    }
    
    const decoder = new TextDecoder()
    let buffer = ''
    
    while (true) {
      const { done, value } = await reader.read()
      
      if (done) {
        break
      }
      
      buffer += decoder.decode(value, { stream: true })
      
      // 处理 NDJSON 格式
      const lines = buffer.split('\n')
      buffer = lines.pop() || '' // 保留未完成的行
      
      for (const line of lines) {
        if (!line.trim()) continue
        
        try {
          const chunk: StreamChunk = JSON.parse(line)
          
          if (chunk.error) {
            throw new Error(chunk.error)
          }
          
          if (chunk.response) {
            yield chunk.response
          }
          
          if (chunk.done) {
            return
          }
        } catch (parseError) {
          // 忽略解析错误，可能是不完整的行
          console.warn('解析流数据失败:', parseError)
        }
      }
    }
  } catch (error) {
    console.error('流式对话错误:', error)
    yield '抱歉，AI 服务暂时不可用。'
  }
}

/**
 * 生成子主题标题 - 用于 Pin 到编辑器
 * @param text 用户 Pin 的文本内容
 * @returns 3-5 个字的子主题标题
 */
export async function generateSubTopic(text: string): Promise<string> {
  try {
    // 截取前 500 个字符，避免 prompt 过长
    const truncatedText = text.substring(0, 500).replace(/\n+/g, ' ').trim()
    
    const response = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt: `为以下文本生成一个3-5个字的子主题标题，只返回标题，不要其他内容：\n\n${truncatedText}`,
        stream: false,
        options: {
          temperature: 0.3,
          num_predict: 20
        }
      })
    })
    
    if (!response.ok) {
      throw new Error(`AI 请求失败: ${response.status}`)
    }
    
    const data = await response.json()
    
    // 清理响应，移除引号和多余空白
    const title = data.response?.trim()
      .replace(/^["'""]|["'""]$/g, '') // 移除首尾引号
      .replace(/\n/g, ' ') // 替换换行为空格
      .trim()
    
    // 如果标题太短或为空，使用文本前10个字符
    if (!title || title.length < 2) {
      return text.substring(0, 10).replace(/[#\n]/g, '').trim() || '未命名主题'
    }
    
    // 限制标题长度
    return title.substring(0, 20)
  } catch (error) {
    console.error('生成子主题标题失败:', error)
    
    // 降级处理：使用文本前10个字符
    return text.substring(0, 10).replace(/[#\n]/g, '').trim() || '未命名主题'
  }
}

/**
 * 非流式对话 - 用于简单问答
 * @param prompt 用户输入的提示
 * @returns AI 的完整响应
 */
export async function chat(prompt: string): Promise<string> {
  try {
    const response = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt: `你是一个智能助手，用简洁专业的中文回答问题。\n\n用户：${prompt}\n助手：`,
        stream: false,
        options: {
          temperature: 0.7,
          num_predict: 1000
        }
      })
    })
    
    if (!response.ok) {
      throw new Error(`AI 请求失败: ${response.status}`)
    }
    
    const data = await response.json()
    return data.response?.trim() || '抱歉，无法生成回答。'
  } catch (error) {
    console.error('对话错误:', error)
    return '抱歉，AI 服务暂时不可用。'
  }
}

export default {
  streamChat,
  generateSubTopic,
  chat
}