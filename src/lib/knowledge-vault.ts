import { supabase } from './supabase'
import type {
  KnowledgeVaultNote,
  CreateKnowledgeVaultNote,
  UpdateKnowledgeVaultNote,
  KnowledgeVaultQuery,
  VectorSearchQuery,
  VectorSearchResult,
  CategoryStat,
  TagStat,
  KnowledgeVaultStats,
  CategoryDetailStat,
  FullTextSearchResult,
  TableSizeInfo,
  IndexUsageStat,
  PaginatedResult,
  ApiResponse,
} from '@/types/knowledge-vault'

// ============================================================
// Knowledge Vault API 函数
// ============================================================

/**
 * 获取所有笔记（带分页和过滤）
 */
export async function getNotes(
  query: KnowledgeVaultQuery = {}
): Promise<ApiResponse<PaginatedResult<KnowledgeVaultNote>>> {
  try {
    const {
      category,
      tags,
      search,
      sortBy = 'updated_at',
      sortOrder = 'desc',
      page = 1,
      pageSize = 20,
    } = query

    // 构建查询
    let supabaseQuery = supabase
      .from('knowledge_vault')
      .select('*', { count: 'exact' })

    // 应用过滤器
    if (category) {
      supabaseQuery = supabaseQuery.eq('category', category)
    }

    if (tags && tags.length > 0) {
      supabaseQuery = supabaseQuery.contains('tags', tags)
    }

    if (search) {
      supabaseQuery = supabaseQuery.or(
        `title.ilike.%${search}%,content.ilike.%${search}%,summary.ilike.%${search}%`
      )
    }

    // 应用排序
    supabaseQuery = supabaseQuery.order(sortBy, { ascending: sortOrder === 'asc' })

    // 应用分页
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    supabaseQuery = supabaseQuery.range(from, to)

    // 执行查询
    const { data, error, count } = await supabaseQuery

    if (error) {
      throw error
    }

    const total = count || 0
    const totalPages = Math.ceil(total / pageSize)

    return {
      success: true,
      data: {
        data: data || [],
        total,
        page,
        pageSize,
        totalPages,
      },
    }
  } catch (error) {
    console.error('Error fetching notes:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * 根据 ID 获取单个笔记
 */
export async function getNoteById(
  id: string
): Promise<ApiResponse<KnowledgeVaultNote>> {
  try {
    const { data, error } = await supabase
      .from('knowledge_vault')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      throw error
    }

    return {
      success: true,
      data,
    }
  } catch (error) {
    console.error('Error fetching note:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * 创建新笔记
 */
export async function createNote(
  note: CreateKnowledgeVaultNote
): Promise<ApiResponse<KnowledgeVaultNote>> {
  try {
    const { data, error } = await supabase
      .from('knowledge_vault')
      .insert(note)
      .select()
      .single()

    if (error) {
      throw error
    }

    return {
      success: true,
      data,
      message: '笔记创建成功',
    }
  } catch (error) {
    console.error('Error creating note:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * 更新笔记
 */
export async function updateNote(
  id: string,
  updates: UpdateKnowledgeVaultNote
): Promise<ApiResponse<KnowledgeVaultNote>> {
  try {
    const { data, error } = await supabase
      .from('knowledge_vault')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw error
    }

    return {
      success: true,
      data,
      message: '笔记更新成功',
    }
  } catch (error) {
    console.error('Error updating note:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * 删除笔记
 */
export async function deleteNote(
  id: string
): Promise<ApiResponse<void>> {
  try {
    const { error } = await supabase
      .from('knowledge_vault')
      .delete()
      .eq('id', id)

    if (error) {
      throw error
    }

    return {
      success: true,
      message: '笔记删除成功',
    }
  } catch (error) {
    console.error('Error deleting note:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * 批量删除笔记
 */
export async function deleteNotes(
  ids: string[]
): Promise<ApiResponse<void>> {
  try {
    const { error } = await supabase
      .from('knowledge_vault')
      .delete()
      .in('id', ids)

    if (error) {
      throw error
    }

    return {
      success: true,
      message: `成功删除 ${ids.length} 条笔记`,
    }
  } catch (error) {
    console.error('Error deleting notes:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// ============================================================
// 向量搜索函数
// ============================================================

/**
 * 执行向量搜索（混合检索）
 */
export async function searchNotes(
  params: VectorSearchQuery
): Promise<ApiResponse<VectorSearchResult[]>> {
  try {
    const { data, error } = await supabase.rpc('match_notes', {
      query_embedding: params.query_embedding,
      filter_category: params.filter_category || null,
      filter_tags: params.filter_tags || null,
      match_count: params.match_count || 5,
      match_threshold: params.match_threshold || 0.0,
    })

    if (error) {
      throw error
    }

    return {
      success: true,
      data: data || [],
    }
  } catch (error) {
    console.error('Error searching notes:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// ============================================================
// 分类和标签函数
// ============================================================

/**
 * 获取所有分类及其笔记数量
 */
export async function getCategories(): Promise<ApiResponse<CategoryStat[]>> {
  try {
    const { data, error } = await supabase.rpc('get_categories')

    if (error) {
      throw error
    }

    return {
      success: true,
      data: data || [],
    }
  } catch (error) {
    console.error('Error fetching categories:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * 获取所有标签及其使用次数
 */
export async function getAllTags(): Promise<ApiResponse<TagStat[]>> {
  try {
    const { data, error } = await supabase.rpc('get_all_tags')

    if (error) {
      throw error
    }

    return {
      success: true,
      data: data || [],
    }
  } catch (error) {
    console.error('Error fetching tags:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * 按标签搜索笔记
 */
export async function searchNotesByTag(
  tag: string,
  limit: number = 20
): Promise<ApiResponse<KnowledgeVaultNote[]>> {
  try {
    const { data, error } = await supabase.rpc('search_notes_by_tag', {
      search_tag: tag,
      result_limit: limit,
    })

    if (error) {
      throw error
    }

    return {
      success: true,
      data: data || [],
    }
  } catch (error) {
    console.error('Error searching notes by tag:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * 按分类搜索笔记
 */
export async function searchNotesByCategory(
  category: string,
  limit: number = 20
): Promise<ApiResponse<KnowledgeVaultNote[]>> {
  try {
    const { data, error } = await supabase.rpc('search_notes_by_category', {
      search_category: category,
      result_limit: limit,
    })

    if (error) {
      throw error
    }

    return {
      success: true,
      data: data || [],
    }
  } catch (error) {
    console.error('Error searching notes by category:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * 全文搜索
 */
export async function fullTextSearch(
  query: string,
  limit: number = 20
): Promise<ApiResponse<FullTextSearchResult[]>> {
  try {
    const { data, error } = await supabase.rpc('full_text_search', {
      search_query: query,
      result_limit: limit,
    })

    if (error) {
      throw error
    }

    return {
      success: true,
      data: data || [],
    }
  } catch (error) {
    console.error('Error performing full text search:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// ============================================================
// 统计函数
// ============================================================

/**
 * 获取知识库统计信息
 */
export async function getKnowledgeVaultStats(): Promise<ApiResponse<KnowledgeVaultStats>> {
  try {
    const { data, error } = await supabase
      .from('knowledge_vault_stats')
      .select('*')
      .single()

    if (error) {
      throw error
    }

    return {
      success: true,
      data,
    }
  } catch (error) {
    console.error('Error fetching stats:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * 获取分类统计信息
 */
export async function getCategoryStats(): Promise<ApiResponse<CategoryDetailStat[]>> {
  try {
    const { data, error } = await supabase
      .from('category_stats')
      .select('*')

    if (error) {
      throw error
    }

    return {
      success: true,
      data: data || [],
    }
  } catch (error) {
    console.error('Error fetching category stats:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * 获取最近笔记
 */
export async function getRecentNotes(
  limit: number = 50
): Promise<ApiResponse<KnowledgeVaultNote[]>> {
  try {
    const { data, error } = await supabase
      .from('recent_notes')
      .select('*')
      .limit(limit)

    if (error) {
      throw error
    }

    return {
      success: true,
      data: data || [],
    }
  } catch (error) {
    console.error('Error fetching recent notes:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * 获取表大小信息
 */
export async function getTableSize(): Promise<ApiResponse<TableSizeInfo>> {
  try {
    const { data, error } = await supabase.rpc('get_knowledge_vault_size')

    if (error) {
      throw error
    }

    return {
      success: true,
      data: data?.[0],
    }
  } catch (error) {
    console.error('Error fetching table size:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * 获取索引使用统计
 */
export async function getIndexUsageStats(): Promise<ApiResponse<IndexUsageStat[]>> {
  try {
    const { data, error } = await supabase.rpc('get_index_usage_stats')

    if (error) {
      throw error
    }

    return {
      success: true,
      data: data || [],
    }
  } catch (error) {
    console.error('Error fetching index usage stats:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// ============================================================
// 辅助函数
// ============================================================

/**
 * 生成随机向量（用于测试）
 */
export function generateRandomVector(dimension: number = 1024): number[] {
  return Array.from({ length: dimension }, () => Math.random())
}

/**
 * 计算两个向量的余弦相似度
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length')
  }

  let dotProduct = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }

  normA = Math.sqrt(normA)
  normB = Math.sqrt(normB)

  if (normA === 0 || normB === 0) {
    return 0
  }

  return dotProduct / (normA * normB)
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let unitIndex = 0
  let size = bytes

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`
}

/**
 * 格式化日期时间
 */
export function formatDateTime(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * 计算相对时间
 */
export function getRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSeconds < 60) {
    return '刚刚'
  } else if (diffMinutes < 60) {
    return `${diffMinutes} 分钟前`
  } else if (diffHours < 24) {
    return `${diffHours} 小时前`
  } else if (diffDays < 30) {
    return `${diffDays} 天前`
  } else {
    return formatDateTime(dateString)
  }
}