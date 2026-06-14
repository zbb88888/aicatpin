// AICatPin 类型定义

/**
 * UUID 类型
 */
export type UUID = string

/**
 * ISO 8601 日期时间字符串
 */
export type ISODateTime = string

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
  filePath?: string
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
  embedding?: number[]
  created_at: string
  updated_at: string
}

/**
 * 分类统计
 */
export interface CategoryStat {
  category: string
  count: number
}

/**
 * 标签统计
 */
export interface TagStat {
  tag: string
  count: number
}