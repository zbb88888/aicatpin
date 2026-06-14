// AICatPin 类型定义索引文件

// 导出 Knowledge Vault 类型
export * from './knowledge-vault'

// 导出旧的类型（保持向后兼容）
export interface Namespace {
  id: string
  name: string
  description?: string
  created_at: string
  updated_at: string
}

export interface Note {
  id: string
  title: string
  content?: string
  namespace_id: string
  tags: string[]
  summary?: string
  created_at: string
  updated_at: string
}

export interface Tag {
  id: string
  name: string
  color: string
  created_at: string
}

// ============================================================
// 通用类型
// ============================================================

/**
 * UUID 类型
 */
export type UUID = string

/**
 * ISO 8601 日期时间字符串
 */
export type ISODateTime = string

/**
 * JSONB 值类型
 */
export type JsonbValue = 
  | string 
  | number 
  | boolean 
  | null 
  | JsonbValue[] 
  | { [key: string]: JsonbValue }

/**
 * 向量类型（number 数组）
 */
export type Vector = number[]

/**
 * 分页参数
 */
export interface PaginationParams {
  page?: number
  pageSize?: number
}

/**
 * 排序参数
 */
export interface SortParams {
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

/**
 * 过滤参数
 */
export interface FilterParams {
  search?: string
  category?: string
  tags?: string[]
  dateFrom?: string
  dateTo?: string
}

/**
 * 查询参数（组合分页、排序、过滤）
 */
export interface QueryParams extends PaginationParams, SortParams, FilterParams {}

/**
 * API 错误类型
 */
export interface ApiError {
  code: string
  message: string
  details?: unknown
}

/**
 * 加载状态类型
 */
export type LoadingState = 'idle' | 'loading' | 'success' | 'error'

/**
 * 主题类型
 */
export type Theme = 'light' | 'dark' | 'system'

/**
 * 侧边栏位置
 */
export type SidebarPosition = 'left' | 'right'

/**
 * 编辑器模式
 */
export type EditorMode = 'edit' | 'preview' | 'split'

/**
 * 视图模式
 */
export type ViewMode = 'list' | 'grid' | 'table'

/**
 * 排序选项
 */
export interface SortOption {
  value: string
  label: string
  icon?: string
}

/**
 * 分类选项
 */
export interface CategoryOption {
  value: string
  label: string
  count?: number
  icon?: string
}

/**
 * 标签选项
 */
export interface TagOption {
  value: string
  label: string
  count?: number
  color?: string
}