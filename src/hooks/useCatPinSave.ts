import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { SaveStatus, SaveResult } from '@/types'

// ============================================================
// Ollama API 配置
// ============================================================

const OLLAMA_BASE_URL = 'http://127.0.0.1:11434'
const OLLAMA_MODEL = 'gemma4:e2b'
const EMBEDDING_MODEL = 'nomic-embed-text'
const EMBEDDING_DIMENSION = 1024

// ============================================================
// Ollama API 函数
// ============================================================

interface OllamaMetadata {
  title: string
  category: string
  tags: string[]
  summary: string
}

/**
 * 调用 Ollama 生成 API 提取元数据
 */
async function extractMetadata(content: string): Promise<OllamaMetadata> {
  const prompt = `分析以下内容，提取元数据。

要求：
1. title: 简洁标题（不超过50字符）
2. category: 分类（Programming, Networking, Database, Systems, Security, DevOps, AI, Other）
3. tags: 3-5个标签（小写英文数组）
4. summary: 摘要（不超过150字符）

返回JSON格式：
{"title":"标题","category":"分类","tags":["标签1","标签2"],"summary":"摘要"}

内容：
${content.substring(0, 2000)}`

  const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      prompt,
      stream: false,
      format: 'json',
      options: { temperature: 0.3, num_predict: 500 }
    }),
  })

  if (!response.ok) {
    throw new Error(`Ollama API 错误: ${response.status}`)
  }

  const data = await response.json()
  const metadata = JSON.parse(data.response)
  
  return {
    title: String(metadata.title || 'Untitled').substring(0, 100),
    category: String(metadata.category || 'Other'),
    tags: Array.isArray(metadata.tags) 
      ? metadata.tags.map((t: unknown) => String(t).toLowerCase().trim()).slice(0, 10)
      : [],
    summary: String(metadata.summary || '').substring(0, 500),
  }
}

/**
 * 调用 Ollama 嵌入 API 获取向量
 */
async function getEmbedding(text: string): Promise<number[]> {
  const response = await fetch(`${OLLAMA_BASE_URL}/api/embeddings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: EMBEDDING_MODEL, prompt: text }),
  })

  if (!response.ok) {
    throw new Error(`Ollama Embedding API 错误: ${response.status}`)
  }

  const data = await response.json()
  
  if (!data.embedding || !Array.isArray(data.embedding)) {
    throw new Error('无效的嵌入向量响应')
  }

  return data.embedding
}

/**
 * 插入数据到 Supabase
 */
async function insertToSupabase(
  content: string,
  metadata: OllamaMetadata,
  embedding: number[]
): Promise<string> {
  const { data, error } = await supabase
    .from('knowledge_vault')
    .insert({
      title: metadata.title,
      content,
      category: metadata.category,
      tags: metadata.tags,
      summary: metadata.summary,
      embedding,
    })
    .select('id')
    .single()

  if (error) {
    throw new Error(`Supabase 插入错误: ${error.message}`)
  }

  return data.id
}

// ============================================================
// useCatPinSave Hook
// ============================================================

export interface UseCatPinSaveReturn {
  saveNote: (content: string) => Promise<SaveResult>
  status: SaveStatus
  progress: string
  error: string | null
  isSaving: boolean
  lastResult: SaveResult | null
  resetStatus: () => void
}

export function useCatPinSave(): UseCatPinSaveReturn {
  const [status, setStatus] = useState<SaveStatus>('idle')
  const [progress, setProgress] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [lastResult, setLastResult] = useState<SaveResult | null>(null)

  const isSaving = ['extracting', 'embedding', 'saving', 'syncing'].includes(status)

  const resetStatus = useCallback(() => {
    setStatus('idle')
    setProgress('')
    setError(null)
  }, [])

  const saveNote = useCallback(async (content: string): Promise<SaveResult> => {
    if (!content || content.trim().length === 0) {
      return { success: false, error: '内容不能为空' }
    }

    try {
      // 步骤 1: 提取元数据
      setStatus('extracting')
      setProgress('AI 重构中...')
      setError(null)

      let metadata: OllamaMetadata
      try {
        metadata = await extractMetadata(content)
      } catch {
        metadata = {
          title: content.substring(0, 50).replace(/[#\n]/g, '').trim() || 'Untitled',
          category: 'Other',
          tags: [],
          summary: content.substring(0, 150).replace(/[#\n]/g, '').trim(),
        }
      }

      // 步骤 2: 生成向量嵌入
      setStatus('embedding')
      setProgress('向量计算中...')

      const embeddingText = `${metadata.title} ${metadata.summary} ${content.substring(0, 500)}`
      let embedding: number[]
      
      try {
        embedding = await getEmbedding(embeddingText)
      } catch {
        embedding = new Array(EMBEDDING_DIMENSION).fill(0)
      }

      // 步骤 3: 保存到 Supabase
      setStatus('saving')
      setProgress('持久化中...')

      const id = await insertToSupabase(content, metadata, embedding)

      // 完成
      setStatus('success')
      setProgress('已原子化落盘')

      const result: SaveResult = { success: true, id, metadata }
      setLastResult(result)

      setTimeout(() => {
        setStatus('idle')
        setProgress('')
      }, 3000)

      return result

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '保存失败'
      setStatus('error')
      setError(errorMessage)
      setProgress('')

      const result: SaveResult = { success: false, error: errorMessage }
      setLastResult(result)
      return result
    }
  }, [])

  return {
    saveNote,
    status,
    progress,
    error,
    isSaving,
    lastResult,
    resetStatus,
  }
}

export default useCatPinSave