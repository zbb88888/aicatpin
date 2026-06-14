// AICatPin 类型定义

/**
 * 保存状态
 */
export type SaveStatus = 'idle' | 'extracting' | 'embedding' | 'saving' | 'syncing' | 'success' | 'error'

/**
 * 保存结果
 */
export interface SaveResult {
  success: boolean
  id?: string
  error?: string
  metadata?: {
    title: string
    category: string
    tags: string[]
    summary: string
  }
}

/**
 * 笔记数据结构
 */
export interface Note {
  id: string
  title: string
  content?: string
  category: string
  tags: string[]
  summary?: string
  created_at: string
  updated_at: string
}