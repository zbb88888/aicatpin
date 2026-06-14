import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { invoke } from '@tauri-apps/api/core'
import type { TauriNote } from '@/types/tauri'

// ============================================================
// 类型定义
// ============================================================

/** Ollama 生成的元数据 */
interface OllamaMetadata {
  title: string
  category: string
  tags: string[]
  summary: string
}

/** 保存结果 */
export interface SaveResult {
  success: boolean
  id?: string
  error?: string
  metadata?: OllamaMetadata
  filePath?: string
}

/** 保存状态 */
export type SaveStatus = 'idle' | 'extracting' | 'embedding' | 'saving' | 'syncing' | 'success' | 'error'

/** Hook 返回值 */
export interface UseCatPinSaveReturn {
  /** 保存笔记 */
  saveNote: (content: string) => Promise<SaveResult>
  /** 当前状态 */
  status: SaveStatus
  /** 进度信息 */
  progress: string
  /** 错误信息 */
  error: string | null
  /** 是否正在保存 */
  isSaving: boolean
  /** 上次保存的结果 */
  lastResult: SaveResult | null
  /** 重置状态 */
  resetStatus: () => void
}

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

/**
 * 调用 Ollama 生成 API 提取元数据
 */
async function extractMetadata(content: string): Promise<OllamaMetadata> {
  const prompt = `你是一个知识管理助手。请分析以下内容，并提取元数据。

要求：
1. title: 提取一个简洁的标题（不超过50个字符）
2. category: 选择一个最合适的分类（只能选择一个，从以下选项中选择：Programming, Networking, Database, Systems, Security, DevOps, AI, Other）
3. tags: 提取3-5个相关标签（小写英文，用数组格式）
4. summary: 生成一段简洁的摘要（不超过150个字符）

请严格按照以下JSON格式返回，不要包含任何其他内容：
{
  "title": "标题",
  "category": "分类",
  "tags": ["标签1", "标签2", "标签3"],
  "summary": "摘要内容"
}

内容：
${content.substring(0, 2000)}` // 限制内容长度，避免 token 过多

  const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      prompt: prompt,
      stream: false,
      format: 'json',
      options: {
        temperature: 0.3,
        num_predict: 500,
      },
    }),
  })

  if (!response.ok) {
    throw new Error(`Ollama API 错误: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  
  try {
    // 解析 JSON 响应
    const metadata = JSON.parse(data.response)
    
    // 验证和清理数据
    return {
      title: String(metadata.title || 'Untitled').substring(0, 100),
      category: String(metadata.category || 'Other'),
      tags: Array.isArray(metadata.tags) 
        ? metadata.tags.map((t: unknown) => String(t).toLowerCase().trim()).slice(0, 10)
        : [],
      summary: String(metadata.summary || '').substring(0, 500),
    }
  } catch (parseError) {
    console.error('解析 Ollama 响应失败:', data.response)
    throw new Error('无法解析 AI 返回的元数据')
  }
}

/**
 * 调用 Ollama 嵌入 API 获取向量
 */
async function getEmbedding(text: string): Promise<number[]> {
  const response = await fetch(`${OLLAMA_BASE_URL}/api/embeddings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      prompt: text,
    }),
  })

  if (!response.ok) {
    throw new Error(`Ollama Embedding API 错误: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  
  if (!data.embedding || !Array.isArray(data.embedding)) {
    throw new Error('无效的嵌入向量响应')
  }

  // 验证向量维度
  if (data.embedding.length !== EMBEDDING_DIMENSION) {
    console.warn(`向量维度不匹配: 期望 ${EMBEDDING_DIMENSION}, 实际 ${data.embedding.length}`)
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
      content: content,
      category: metadata.category,
      tags: metadata.tags,
      summary: metadata.summary,
      embedding: embedding,
    })
    .select('id')
    .single()

  if (error) {
    throw new Error(`Supabase 插入错误: ${error.message}`)
  }

  return data.id
}

/**
 * 调用 Tauri Rust Command 同步到文件系统
 */
async function syncToFileSystem(
  id: string,
  title: string,
  category: string,
  tags: string[],
  summary: string,
  content: string
): Promise<string> {
  try {
    const note: TauriNote = {
      id,
      title,
      category,
      tags,
      summary,
      content,
      created_at: new Date().toISOString(),
    }

    const result = await invoke<string>('sync_to_fs', { note })
    return result
  } catch (error) {
    console.error('文件系统同步失败:', error)
    // 文件同步失败不应该阻止整个保存流程
    // 只记录警告，不抛出错误
    console.warn('笔记已保存到数据库，但文件同步失败')
    return '文件同步失败'
  }
}

/**
 * 检查 Ollama 服务状态
 */
async function checkOllamaStatus(): Promise<boolean> {
  try {
    const result = await invoke<boolean>('check_ollama_status')
    return result
  } catch {
    return false
  }
}

// ============================================================
// useCatPinSave Hook
// ============================================================

/**
 * 保存笔记的 Hook
 * 
 * 实现完整的 AI 管道：
 * 1. 提取元数据（标题、分类、标签、摘要）
 * 2. 生成嵌入向量
 * 3. 插入 Supabase
 * 4. 同步到文件系统
 */
export function useCatPinSave(): UseCatPinSaveReturn {
  const [status, setStatus] = useState<SaveStatus>('idle')
  const [progress, setProgress] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [lastResult, setLastResult] = useState<SaveResult | null>(null)

  const isSaving = status === 'extracting' || 
                   status === 'embedding' || 
                   status === 'saving' || 
                   status === 'syncing'

  const resetStatus = useCallback(() => {
    setStatus('idle')
    setProgress('')
    setError(null)
  }, [])

  const saveNote = useCallback(async (content: string): Promise<SaveResult> => {
    // 验证内容
    if (!content || content.trim().length === 0) {
      const result: SaveResult = {
        success: false,
        error: '内容不能为空',
      }
      setLastResult(result)
      return result
    }

    // 检查 Ollama 是否可用
    const ollamaAvailable = await checkOllamaStatus()
    if (!ollamaAvailable) {
      const result: SaveResult = {
        success: false,
        error: '无法连接到 Ollama 服务，请确保 Ollama 正在运行 (http://127.0.0.1:11434)',
      }
      setStatus('error')
      setError(result.error || null)
      setLastResult(result)
      return result
    }

    try {
      // 步骤 1: 提取元数据
      setStatus('extracting')
      setProgress('正在使用 AI 提取元数据...')
      setError(null)

      let metadata: OllamaMetadata
      try {
        metadata = await extractMetadata(content)
      } catch (err) {
        // 如果 AI 提取失败，使用默认值
        console.warn('AI 元数据提取失败，使用默认值:', err)
        metadata = {
          title: content.substring(0, 50).replace(/[#\n]/g, '').trim() || 'Untitled',
          category: 'Other',
          tags: [],
          summary: content.substring(0, 150).replace(/[#\n]/g, '').trim(),
        }
      }

      // 步骤 2: 生成嵌入向量
      setStatus('embedding')
      setProgress('正在生成向量嵌入...')

      const embeddingText = `${metadata.title} ${metadata.summary} ${content.substring(0, 500)}`
      let embedding: number[]
      
      try {
        embedding = await getEmbedding(embeddingText)
      } catch (err) {
        console.warn('嵌入向量生成失败，使用零向量:', err)
        // 如果嵌入失败，使用零向量（语义搜索将不可用）
        embedding = new Array(EMBEDDING_DIMENSION).fill(0)
      }

      // 步骤 3: 插入 Supabase
      setStatus('saving')
      setProgress('正在保存到数据库...')

      const id = await insertToSupabase(content, metadata, embedding)

      // 步骤 4: 同步到文件系统
      setStatus('syncing')
      setProgress('正在同步到本地文件系统...')

      const syncResult = await syncToFileSystem(
        id,
        metadata.title,
        metadata.category,
        metadata.tags,
        metadata.summary,
        content
      )

      // 完成
      setStatus('success')
      setProgress('保存成功！')

      const result: SaveResult = {
        success: true,
        id,
        metadata,
        filePath: syncResult,
      }
      setLastResult(result)

      // 3秒后重置状态
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

      const result: SaveResult = {
        success: false,
        error: errorMessage,
      }
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