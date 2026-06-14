// Knowledge Vault 类型定义
// 对应 PostgreSQL knowledge_vault 表

/**
 * 知识库笔记接口
 * 对应 knowledge_vault 表
 */
export interface KnowledgeVaultNote {
  /** 唯一标识符 (UUID) */
  id: string
  
  /** 笔记标题 */
  title: string
  
  /** 原始 Markdown 内容 */
  content?: string
  
  /** 分类名称 (强约束，非空) */
  category: string
  
  /** 标签数组 (JSONB 格式，默认为空数组) */
  tags: string[]
  
  /** AI 生成的摘要 */
  summary?: string
  
  /** 1024 维向量嵌入 */
  embedding?: number[]
  
  /** 创建时间 */
  created_at: string
  
  /** 最后更新时间 */
  updated_at: string
}

/**
 * 创建笔记请求接口
 */
export interface CreateKnowledgeVaultNote {
  title: string
  content?: string
  category: string
  tags?: string[]
  summary?: string
  embedding?: number[]
}

/**
 * 更新笔记请求接口
 */
export interface UpdateKnowledgeVaultNote {
  title?: string
  content?: string
  category?: string
  tags?: string[]
  summary?: string
  embedding?: number[]
}

/**
 * 笔记查询参数接口
 */
export interface KnowledgeVaultQuery {
  /** 按分类过滤 */
  category?: string
  
  /** 按标签过滤 */
  tags?: string[]
  
  /** 搜索关键词 */
  search?: string
  
  /** 排序字段 */
  sortBy?: 'created_at' | 'updated_at' | 'title'
  
  /** 排序方向 */
  sortOrder?: 'asc' | 'desc'
  
  /** 分页：页码 */
  page?: number
  
  /** 分页：每页数量 */
  pageSize?: number
}

/**
 * 向量搜索参数接口
 */
export interface VectorSearchQuery {
  /** 查询向量 (1024 维) */
  query_embedding: number[]
  
  /** 按分类过滤 */
  filter_category?: string
  
  /** 按标签过滤 */
  filter_tags?: string[]
  
  /** 返回结果数量 (默认 5) */
  match_count?: number
  
  /** 相似度阈值 (默认 0.0) */
  match_threshold?: number
}

/**
 * 向量搜索结果接口
 */
export interface VectorSearchResult {
  id: string
  title: string
  content?: string
  category: string
  tags: string[]
  summary?: string
  similarity: number
  created_at: string
  updated_at: string
}

/**
 * 分类统计接口
 */
export interface CategoryStat {
  category: string
  count: number
}

/**
 * 标签统计接口
 */
export interface TagStat {
  tag: string
  count: number
}

/**
 * 知识库统计接口
 */
export interface KnowledgeVaultStats {
  total_notes: number
  total_categories: number
  notes_with_embeddings: number
  earliest_note: string
  latest_note: string
  avg_content_length: number
}

/**
 * 分类详情统计接口
 */
export interface CategoryDetailStat {
  category: string
  note_count: number
  embedded_count: number
  earliest_note: string
  latest_note: string
}

/**
 * 全文搜索结果接口
 */
export interface FullTextSearchResult {
  id: string
  title: string
  content?: string
  category: string
  tags: string[]
  summary?: string
  rank: number
}

/**
 * 表大小信息接口
 */
export interface TableSizeInfo {
  table_size: string
  index_size: string
  total_size: string
  row_count: number
}

/**
 * 索引使用统计接口
 */
export interface IndexUsageStat {
  index_name: string
  index_scans: number
  tuples_read: number
  tuples_fetched: number
}

// ============================================================
// Supabase 类型生成
// ============================================================

/**
 * Supabase 数据库类型定义
 * 用于类型安全的 Supabase 客户端查询
 */
export interface Database {
  public: {
    Tables: {
      knowledge_vault: {
        Row: KnowledgeVaultNote
        Insert: CreateKnowledgeVaultNote
        Update: UpdateKnowledgeVaultNote
        Relationships: []
      }
    }
    Views: {
      knowledge_vault_stats: {
        Row: KnowledgeVaultStats
      }
      category_stats: {
        Row: CategoryDetailStat
      }
      recent_notes: {
        Row: KnowledgeVaultNote
      }
    }
    Functions: {
      match_notes: {
        Args: VectorSearchQuery
        Returns: VectorSearchResult[]
      }
      get_categories: {
        Args: Record<string, never>
        Returns: CategoryStat[]
      }
      get_all_tags: {
        Args: Record<string, never>
        Returns: TagStat[]
      }
      search_notes_by_tag: {
        Args: { search_tag: string; result_limit?: number }
        Returns: Pick<KnowledgeVaultNote, 'id' | 'title' | 'category' | 'tags' | 'summary' | 'created_at'>[]
      }
      search_notes_by_category: {
        Args: { search_category: string; result_limit?: number }
        Returns: Pick<KnowledgeVaultNote, 'id' | 'title' | 'tags' | 'summary' | 'created_at'>[]
      }
      full_text_search: {
        Args: { search_query: string; result_limit?: number }
        Returns: FullTextSearchResult[]
      }
      get_knowledge_vault_size: {
        Args: Record<string, never>
        Returns: TableSizeInfo[]
      }
      get_index_usage_stats: {
        Args: Record<string, never>
        Returns: IndexUsageStat[]
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

// ============================================================
// 辅助类型
// ============================================================

/**
 * 带相似度的笔记类型
 */
export type NoteWithSimilarity = KnowledgeVaultNote & {
  similarity: number
}

/**
 * 分页结果类型
 */
export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

/**
 * API 响应类型
 */
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

/**
 * 标签颜色映射类型
 */
export type TagColorMap = Record<string, string>

/**
 * 分类图标映射类型
 */
export type CategoryIconMap = Record<string, string>