import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { SaveStatus, SaveResult } from '@/types'

const OLLAMA_URL = 'http://127.0.0.1:11434'
const OLLAMA_MODEL = 'gemma4:e2b'
const EMBEDDING_MODEL = 'nomic-embed-text'
const EMBEDDING_DIM = 1024

interface OllamaMetadata {
  title: string
  category: string
  tags: string[]
  summary: string
}

async function extractMetadata(content: string): Promise<OllamaMetadata> {
  const prompt = `分析以下内容，提取元数据。返回JSON格式：
{"title":"标题(≤50字)","category":"分类(Programming/Networking/Database/Systems/Security/DevOps/AI/Other)","tags":["标签1","标签2"],"summary":"摘要(≤150字)"}

内容：
${content.substring(0, 2000)}`

  const res = await fetch(`${OLLAMA_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: OLLAMA_MODEL, prompt, stream: false, format: 'json',
      options: { temperature: 0.3, num_predict: 500 }
    }),
  })

  if (!res.ok) throw new Error(`Ollama 错误: ${res.status}`)
  const data = await res.json()
  const m = JSON.parse(data.response)

  return {
    title: String(m.title || 'Untitled').substring(0, 100),
    category: String(m.category || 'Other'),
    tags: Array.isArray(m.tags) ? m.tags.map((t: unknown) => String(t).toLowerCase().trim()).slice(0, 10) : [],
    summary: String(m.summary || '').substring(0, 500),
  }
}

async function getEmbedding(text: string): Promise<number[]> {
  const res = await fetch(`${OLLAMA_URL}/api/embeddings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: EMBEDDING_MODEL, prompt: text }),
  })

  if (!res.ok) throw new Error(`Embedding 错误: ${res.status}`)
  const data = await res.json()
  if (!data.embedding?.length) throw new Error('无效嵌入响应')
  return data.embedding
}

async function insertToSupabase(content: string, metadata: OllamaMetadata, embedding: number[]): Promise<string> {
  const { data, error } = await supabase
    .from('knowledge_vault')
    .insert({ title: metadata.title, content, category: metadata.category, tags: metadata.tags, summary: metadata.summary, embedding })
    .select('id')
    .single()

  if (error) throw new Error(`Supabase 错误: ${error.message}`)
  return data.id
}

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
  const [progress, setProgress] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [lastResult, setLastResult] = useState<SaveResult | null>(null)

  const isSaving = ['extracting', 'embedding', 'saving', 'syncing'].includes(status)

  const resetStatus = useCallback(() => {
    setStatus('idle'); setProgress(''); setError(null)
  }, [])

  const saveNote = useCallback(async (content: string): Promise<SaveResult> => {
    if (!content?.trim()) return { success: false, error: '内容不能为空' }

    try {
      setStatus('extracting'); setProgress('AI 重构中...'); setError(null)

      let metadata: OllamaMetadata
      try { metadata = await extractMetadata(content) }
      catch { metadata = { title: content.substring(0, 50).replace(/[#\n]/g, '').trim() || 'Untitled', category: 'Other', tags: [], summary: content.substring(0, 150).replace(/[#\n]/g, '').trim() } }

      setStatus('embedding'); setProgress('向量计算中...')
      let embedding: number[]
      try { embedding = await getEmbedding(`${metadata.title} ${metadata.summary} ${content.substring(0, 500)}`) }
      catch { embedding = new Array(EMBEDDING_DIM).fill(0) }

      setStatus('saving'); setProgress('持久化中...')
      const id = await insertToSupabase(content, metadata, embedding)

      setStatus('success'); setProgress('已保存')
      const result: SaveResult = { success: true, id, metadata }
      setLastResult(result)
      setTimeout(() => { setStatus('idle'); setProgress('') }, 3000)
      return result

    } catch (err) {
      const msg = err instanceof Error ? err.message : '保存失败'
      setStatus('error'); setError(msg); setProgress('')
      const result: SaveResult = { success: false, error: msg }
      setLastResult(result)
      return result
    }
  }, [])

  return { saveNote, status, progress, error, isSaving, lastResult, resetStatus }
}

export default useCatPinSave
