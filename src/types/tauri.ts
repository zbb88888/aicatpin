// Tauri 命令类型定义

/**
 * 笔记数据结构（用于 Tauri 命令）
 */
export interface TauriNote {
  id: string
  title: string
  category: string
  tags: string[]
  summary: string
  content: string
  created_at: string
}

/**
 * Tauri 命令返回结果
 */
export interface TauriCommandResult<T> {
  success: boolean
  data?: T
  error?: string
}

/**
 * 文件同步结果
 */
export interface SyncResult {
  path: string
  success: boolean
  error?: string
}

/**
 * Ollama 状态检查结果
 */
export interface OllamaStatus {
  available: boolean
  models?: string[]
  error?: string
}

/**
 * Vault 信息
 */
export interface VaultInfo {
  path: string
  categories: string[]
  totalNotes: number
}

/**
 * 文件系统操作结果
 */
export interface FsOperationResult {
  success: boolean
  message: string
  path?: string
}