import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { CloudNote } from './useEditorMode'

const OLLAMA_URL = 'http://127.0.0.1:11434'
const OLLAMA_MODEL = 'gemma4:e2b'
const EMBEDDING_MODEL = 'nomic-embed-text'
const EMBEDDING_DIM = 1024

export type SyncStatus = 'idle' | 'extracting' | 'embedding' | 'uploading' | 'cleaning' | 'done' | 'error'

interface Metadata {
  title: string
  category: string
  tags: string[]
  summary: string
}

async function extractMetadata(content: string): Promise<Metadata> {
  const prompt = `分析以下内容，返回JSON：{"title":"标题(≤50字)","category":"分类","tags":["标签"],"summary":"摘要(≤150字)"}

内容：
${content.substring(0, 2000)}`

  const res = await fetch(`${OLLAMA_URL}/api/generate`, {
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

  if (!res.ok) throw new Error(`Ollama 错误: ${res.status}`)
  const m = JSON.parse((await res.json()).response)

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

async function upsertToCloud(
  content: string,
  metadata: Metadata,
  embedding: number[],
  existingId?: string
): Promise<string> {
  const payload = {
    title: metadata.title,
    content,
    category: metadata.category,
    tags: metadata.tags,
    summary: metadata.summary,
    embedding,
    updated_at: new Date().toISOString(),
  }

  if (existingId) {
    // 更新现有记录
    const { data, error } = await supabase
      .from('knowledge_vault')
      .update(payload)
      .eq('id', existingId)
      .select('id')
      .single()

    if (error) throw new Error(`Supabase 更新错误: ${error.message}`)
    return data.id
  } else {
    // 插入新记录
    const { data, error } = await supabase
      .from('knowledge_vault')
      .insert({ ...payload, created_at: new Date().toISOString() })
      .select('id')
      .single()

    if (error) throw new Error(`Supabase 插入错误: ${error.message}`)
    return data.id
  }
}

export function useCloudSync() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle')
  const [syncProgress, setSyncProgress] = useState('')
  const [syncError, setSyncError] = useState<string | null>(null)

  // 完整的同步入库流程
  const syncToCloud = useCallback(async (
    content: string,
    existingId?: string
  ): Promise<{ success: boolean; id?: string; error?: string }> => {
    try {
      setSyncStatus('extracting')
      setSyncProgress('AI 提炼中...')
      setSyncError(null)

      // 1. AI 提取元数据
      let metadata: Metadata
      try {
        metadata = await extractMetadata(content)
      } catch {
        metadata = {
          title: content.substring(0, 50).replace(/[#\n]/g, '').trim() || 'Untitled',
          category: 'Other',
          tags: [],
          summary: content.substring(0, 150).replace(/[#\n]/g, '').trim()
        }
      }

      // 2. 生成向量嵌入
      setSyncStatus('embedding')
      setSyncProgress('向量计算中...')
      let embedding: number[]
      try {
        embedding = await getEmbedding(`${metadata.title} ${metadata.summary} ${content.substring(0, 500)}`)
      } catch {
        embedding = new Array(EMBEDDING_DIM).fill(0)
      }

      // 3. 推送到云端
      setSyncStatus('uploading')
      setSyncProgress('同步入库中...')
      const id = await upsertToCloud(content, metadata, embedding, existingId)

      setSyncStatus('done')
      setSyncProgress('已入库')
      setTimeout(() => {
        setSyncStatus('idle')
        setSyncProgress('')
      }, 2000)

      return { success: true, id }
    } catch (err) {
      const msg = err instanceof Error ? err.message : '同步失败'
      setSyncStatus('error')
      setSyncError(msg)
      setSyncProgress('')
      return { success: false, error: msg }
    }
  }, [])

  // 从云端获取笔记列表
  const fetchCloudNotes = useCallback(async (limit = 20): Promise<CloudNote[]> => {
    const { data, error } = await supabase
      .from('knowledge_vault')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('获取云端笔记失败:', error)
      return []
    }
    return data || []
  }, [])

  // 搜索云端笔记
  const searchCloudNotes = useCallback(async (query: string): Promise<CloudNote[]> => {
    const { data, error } = await supabase
      .from('knowledge_vault')
      .select('*')
      .or(`title.ilike.%${query}%,content.ilike.%${query}%,summary.ilike.%${query}%`)
      .order('updated_at', { ascending: false })
      .limit(20)

    if (error) {
      console.error('搜索云端笔记失败:', error)
      return []
    }
    return data || []
  }, [])

  // 重置同步状态
  const resetSyncStatus = useCallback(() => {
    setSyncStatus('idle')
    setSyncProgress('')
    setSyncError(null)
  }, [])

  return {
    syncStatus,
    syncProgress,
    syncError,
    syncToCloud,
    fetchCloudNotes,
    searchCloudNotes,
    resetSyncStatus,
  }
}
