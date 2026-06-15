-- AICatPin 知识库核心表迁移
-- 创建时间: 2024-01-02
-- 描述: 创建 knowledge_vault 表，启用 pgvector 扩展，创建索引和混合检索函数

-- ============================================================
-- 1. 启用必要的扩展
-- ============================================================

-- 启用 UUID 生成扩展（如果尚未启用）
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 启用 pgvector 扩展（如果尚未启用）
-- 注意: 需要 PostgreSQL 15+ 和 pgvector 扩展已安装
CREATE EXTENSION IF NOT EXISTS "vector";

-- 启用全文搜索扩展（可选，用于增强文本搜索）
-- CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================
-- 2. 创建 knowledge_vault 表
-- ============================================================

-- 删除已存在的表（如果需要重新创建）
-- DROP TABLE IF EXISTS knowledge_vault CASCADE;

CREATE TABLE IF NOT EXISTS knowledge_vault (
  -- 主键：UUID 类型，自动生成
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  
  -- 标题：文本类型，非空约束
  title TEXT NOT NULL,
  
  -- 内容：原始 Markdown 文本
  content TEXT,
  
  -- 分类：字符串类型，强约束（非空）
  category VARCHAR(100) NOT NULL,
  
  -- 标签：JSONB 类型，默认为空数组
  -- 结构: ["tag1", "tag2", "tag3"]
  tags JSONB DEFAULT '[]'::JSONB,
  
  -- 摘要：AI 生成的摘要文本
  summary TEXT,
  
  -- 向量嵌入：1024 维度的向量，用于语义搜索
  -- 使用余弦相似度进行比较
  embedding VECTOR(1024),
  
  -- 创建时间：带时区的时间戳，默认当前时间
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 更新时间：带时区的时间戳，默认当前时间
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 约束：确保标签是数组类型
  CONSTRAINT tags_is_array CHECK (jsonb_typeof(tags) = 'array'),
  
  -- 约束：确保分类不为空字符串
  CONSTRAINT category_not_empty CHECK (LENGTH(TRIM(category)) > 0)
);

-- ============================================================
-- 3. 创建索引
-- ============================================================

-- 3.1 为 tags 字段创建 GIN 索引
-- 加速 JSONB 数组查询，支持 @>, ?, ?|, ?& 操作符
CREATE INDEX IF NOT EXISTS idx_knowledge_vault_tags 
ON knowledge_vault USING GIN (tags);

-- 3.2 为 embedding 字段创建 HNSW 索引
-- 使用余弦相似度 (vector_cosine_ops)
-- HNSW 索引比 IVFFlat 更适合高维度向量，且不需要训练数据
-- 参数说明:
--   m: 每个节点的最大连接数（默认 16）
--   ef_construction: 构建时的搜索范围（默认 64）
CREATE INDEX IF NOT EXISTS idx_knowledge_vault_embedding 
ON knowledge_vault USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- 3.3 为 category 字段创建 B-tree 索引
-- 加速精确匹配和范围查询
CREATE INDEX IF NOT EXISTS idx_knowledge_vault_category 
ON knowledge_vault USING BTREE (category);

-- 3.4 为 created_at 和 updated_at 字段创建索引
-- 加速时间排序和范围查询
CREATE INDEX IF NOT EXISTS idx_knowledge_vault_created_at 
ON knowledge_vault USING BTREE (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_knowledge_vault_updated_at 
ON knowledge_vault USING BTREE (updated_at DESC);

-- 3.5 为 title 字段创建 GIN 索引（使用 pg_trgm 扩展）
-- 加速模糊搜索（如果启用了 pg_trgm 扩展）
-- CREATE INDEX IF NOT EXISTS idx_knowledge_vault_title_gin 
-- ON knowledge_vault USING GIN (title gin_trgm_ops);

-- ============================================================
-- 4. 创建触发器函数
-- ============================================================

-- 自动更新 updated_at 字段的触发器函数
CREATE OR REPLACE FUNCTION update_knowledge_vault_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  -- 设置 updated_at 为当前时间
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 5. 创建触发器
-- ============================================================

-- 在 knowledge_vault 表上创建触发器
CREATE TRIGGER trigger_update_knowledge_vault_updated_at
  BEFORE UPDATE ON knowledge_vault
  FOR EACH ROW
  EXECUTE FUNCTION update_knowledge_vault_updated_at();

-- ============================================================
-- 6. 创建 RPC 函数：混合检索
-- ============================================================

-- 删除已存在的函数（如果需要重新创建）
-- DROP FUNCTION IF EXISTS match_notes;

CREATE OR REPLACE FUNCTION match_notes(
  query_embedding VECTOR(1024),           -- 查询向量（必需）
  filter_category VARCHAR(100) DEFAULT NULL,  -- 可选：按分类过滤
  filter_tags JSONB DEFAULT NULL,             -- 可选：按标签过滤
  match_count INT DEFAULT 5,                  -- 返回结果数量（默认 Top 5）
  match_threshold FLOAT DEFAULT 0.0           -- 相似度阈值（默认 0.0，返回所有结果）
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  category VARCHAR(100),
  tags JSONB,
  summary TEXT,
  similarity FLOAT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
STABLE  -- 函数是稳定的，相同输入产生相同输出
PARALLEL SAFE  -- 函数可以并行执行
AS $$
DECLARE
  -- 声明变量
  search_sql TEXT;
BEGIN
  -- 构建动态 SQL 查询
  -- 使用余弦相似度: 1 - (embedding <=> query_embedding)
  -- <=> 操作符计算余弦距离（0 表示完全相同，2 表示完全相反）
  -- 相似度 = 1 - 余弦距离，范围 [0, 2]，值越大越相似
  
  search_sql := '
    SELECT 
      kv.id,
      kv.title,
      kv.content,
      kv.category,
      kv.tags,
      kv.summary,
      (1 - (kv.embedding <=> $1))::FLOAT AS similarity,
      kv.created_at,
      kv.updated_at
    FROM knowledge_vault kv
    WHERE 
      kv.embedding IS NOT NULL
      AND (1 - (kv.embedding <=> $1)) >= $2
  ';
  
  -- 添加分类过滤条件（如果提供）
  IF filter_category IS NOT NULL THEN
    search_sql := search_sql || ' AND kv.category = $3';
  END IF;
  
  -- 添加标签过滤条件（如果提供）
  IF filter_tags IS NOT NULL THEN
    -- 使用 JSONB 包含操作符 @> 检查标签是否包含在记录的标签中
    -- 例如: filter_tags = '["rust", "programming"]' 将匹配包含这些标签的记录
    IF filter_category IS NOT NULL THEN
      search_sql := search_sql || ' AND kv.tags @> $4';
    ELSE
      search_sql := search_sql || ' AND kv.tags @> $3';
    END IF;
  END IF;
  
  -- 添加排序和限制
  search_sql := search_sql || ' ORDER BY similarity DESC LIMIT $' || 
    CASE 
      WHEN filter_category IS NOT NULL AND filter_tags IS NOT NULL THEN '5'
      WHEN filter_category IS NOT NULL OR filter_tags IS NOT NULL THEN '4'
      ELSE '3'
    END;
  
  -- 执行查询
  IF filter_category IS NOT NULL AND filter_tags IS NOT NULL THEN
    -- 两个过滤器都提供
    RETURN QUERY EXECUTE search_sql 
    USING query_embedding, match_threshold, filter_category, filter_tags, match_count;
  ELSIF filter_category IS NOT NULL THEN
    -- 只提供分类过滤器
    RETURN QUERY EXECUTE search_sql 
    USING query_embedding, match_threshold, filter_category, match_count;
  ELSIF filter_tags IS NOT NULL THEN
    -- 只提供标签过滤器
    RETURN QUERY EXECUTE search_sql 
    USING query_embedding, match_threshold, filter_tags, match_count;
  ELSE
    -- 没有过滤器
    RETURN QUERY EXECUTE search_sql 
    USING query_embedding, match_threshold, match_count;
  END IF;
END;
$$;

-- ============================================================
-- 7. 创建辅助函数
-- ============================================================

-- 7.1 获取所有分类（去重）
CREATE OR REPLACE FUNCTION get_categories()
RETURNS TABLE (
  category VARCHAR(100),
  count BIGINT
)
LANGUAGE SQL
STABLE
AS $$
  SELECT 
    category,
    COUNT(*) as count
  FROM knowledge_vault
  GROUP BY category
  ORDER BY count DESC;
$$;

-- 7.2 获取所有标签（展开 JSONB 数组）
CREATE OR REPLACE FUNCTION get_all_tags()
RETURNS TABLE (
  tag TEXT,
  count BIGINT
)
LANGUAGE SQL
STABLE
AS $$
  SELECT 
    tag.value::TEXT as tag,
    COUNT(*) as count
  FROM knowledge_vault kv,
  LATERAL jsonb_array_elements_text(kv.tags) AS tag(value)
  GROUP BY tag.value
  ORDER BY count DESC;
$$;

-- 7.3 按标签搜索笔记
CREATE OR REPLACE FUNCTION search_notes_by_tag(
  search_tag TEXT,
  result_limit INT DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  category VARCHAR(100),
  tags JSONB,
  summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE SQL
STABLE
AS $$
  SELECT 
    kv.id,
    kv.title,
    kv.category,
    kv.tags,
    kv.summary,
    kv.created_at
  FROM knowledge_vault kv
  WHERE kv.tags @> jsonb_build_array(search_tag)
  ORDER BY kv.created_at DESC
  LIMIT result_limit;
$$;

-- 7.4 按分类搜索笔记
CREATE OR REPLACE FUNCTION search_notes_by_category(
  search_category VARCHAR(100),
  result_limit INT DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  tags JSONB,
  summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE SQL
STABLE
AS $$
  SELECT 
    kv.id,
    kv.title,
    kv.tags,
    kv.summary,
    kv.created_at
  FROM knowledge_vault kv
  WHERE kv.category = search_category
  ORDER BY kv.created_at DESC
  LIMIT result_limit;
$$;

-- 7.5 全文搜索函数（使用 PostgreSQL 内置的全文搜索）
CREATE OR REPLACE FUNCTION full_text_search(
  search_query TEXT,
  result_limit INT DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  category VARCHAR(100),
  tags JSONB,
  summary TEXT,
  rank FLOAT
)
LANGUAGE SQL
STABLE
AS $$
  SELECT 
    kv.id,
    kv.title,
    kv.content,
    kv.category,
    kv.tags,
    kv.summary,
    ts_rank_cd(
      to_tsvector('simple', kv.title || ' ' || COALESCE(kv.content, '')),
      plainto_tsquery('simple', search_query)
    )::FLOAT as rank
  FROM knowledge_vault kv
  WHERE 
    to_tsvector('simple', kv.title || ' ' || COALESCE(kv.content, '')) @@ 
    plainto_tsquery('simple', search_query)
  ORDER BY rank DESC
  LIMIT result_limit;
$$;

-- ============================================================
-- 8. 创建视图
-- ============================================================

-- 8.1 笔记统计视图
CREATE OR REPLACE VIEW knowledge_vault_stats AS
SELECT 
  COUNT(*) as total_notes,
  COUNT(DISTINCT category) as total_categories,
  COUNT(embedding) as notes_with_embeddings,
  MIN(created_at) as earliest_note,
  MAX(created_at) as latest_note,
  AVG(LENGTH(content)) as avg_content_length
FROM knowledge_vault;

-- 8.2 分类统计视图
CREATE OR REPLACE VIEW category_stats AS
SELECT 
  category,
  COUNT(*) as note_count,
  COUNT(embedding) as embedded_count,
  MIN(created_at) as earliest_note,
  MAX(created_at) as latest_note
FROM knowledge_vault
GROUP BY category
ORDER BY note_count DESC;

-- 8.3 最近笔记视图
CREATE OR REPLACE VIEW recent_notes AS
SELECT 
  id,
  title,
  category,
  tags,
  summary,
  created_at,
  updated_at
FROM knowledge_vault
ORDER BY updated_at DESC
LIMIT 50;

-- ============================================================
-- 9. 启用行级安全性 (RLS)
-- ============================================================

-- 启用 RLS
ALTER TABLE knowledge_vault ENABLE ROW LEVEL SECURITY;

-- 创建策略：允许所有操作（本地开发环境）
-- 注意：生产环境需要更严格的策略
CREATE POLICY "Allow all operations on knowledge_vault" 
ON knowledge_vault 
FOR ALL 
USING (true)
WITH CHECK (true);

-- ============================================================
-- 10. 授予权限
-- ============================================================

-- 授予 postgres 用户所有权限
GRANT ALL PRIVILEGES ON TABLE knowledge_vault TO postgres;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;

-- 授予 anon 和 authenticated 用户读取权限（Supabase 角色）
GRANT SELECT ON TABLE knowledge_vault TO anon;
GRANT SELECT ON TABLE knowledge_vault TO authenticated;

-- 授予 authenticated 用户写入权限
GRANT INSERT, UPDATE, DELETE ON TABLE knowledge_vault TO authenticated;

-- ============================================================
-- 11. 插入示例数据（可选）
-- ============================================================

-- 插入一些示例数据
INSERT INTO knowledge_vault (title, content, category, tags, summary) VALUES
(
  'Rust 所有权系统详解',
  '# Rust 所有权系统

Rust 的所有权系统是其最独特的特性之一。它确保了内存安全而无需垃圾回收器。

## 三条规则

1. 每个值都有一个变量，称为其所有者
2. 一次只能有一个所有者
3. 当所有者离开作用域时，值将被丢弃

## 示例

```rust
fn main() {
    let s1 = String::from("hello");
    let s2 = s1; // s1 的所有权移动到 s2
    // println!("{}", s1); // 错误！s1 已失效
    println!("{}", s2); // 正确
}
```',
  'Programming',
  '["rust", "ownership", "memory-safety", "systems-programming"]'::JSONB,
  'Rust 所有权系统的核心概念和规则详解'
),
(
  'TCP 三次握手过程',
  '# TCP 三次握手

TCP 连接建立需要三次握手：

1. 客户端发送 SYN 包
2. 服务器回复 SYN-ACK 包
3. 客户端发送 ACK 包

## 状态变化

- 客户端: CLOSED → SYN_SENT → ESTABLISHED
- 服务器: CLOSED → LISTEN → SYN_RCVD → ESTABLISHED',
  'Networking',
  '["tcp", "networking", "protocol", "connection"]'::JSONB,
  'TCP 三次握手的完整过程和状态变化'
),
(
  'PostgreSQL 索引类型',
  '# PostgreSQL 索引类型

PostgreSQL 支持多种索引类型：

1. B-tree：默认，适用于等值和范围查询
2. Hash：仅适用于等值查询
3. GiST：适用于几何数据和全文搜索
4. GIN：适用于数组、JSONB 和全文搜索
5. BRIN：适用于物理排序的数据

## 选择建议

- 等值查询: B-tree
- 范围查询: B-tree
- 数组/JSONB 查询: GIN
- 全文搜索: GIN 或 GiST',
  'Database',
  '["postgresql", "database", "index", "performance"]'::JSONB,
  'PostgreSQL 各种索引类型的比较和使用场景'
),
(
  'Linux 内存管理',
  '# Linux 内存管理

Linux 使用虚拟内存系统，每个进程有自己的地址空间。

## 关键概念

- 虚拟地址空间
- 页表
- 页面置换
- 内存映射

## 命令

```bash
# 查看内存使用
free -h

# 查看进程内存
ps aux --sort=-%mem

# 查看详细内存信息
cat /proc/meminfo
```',
  'Systems',
  '["linux", "memory", "operating-system", "kernel"]'::JSONB,
  'Linux 内存管理机制和常用监控命令'
),
(
  '向量数据库原理',
  '# 向量数据库原理

向量数据库专门用于存储和查询高维向量数据。

## 核心技术

1. 向量索引：HNSW、IVF、PQ
2. 距离度量：余弦相似度、欧氏距离、内积
3. 近似最近邻搜索（ANN）

## 应用场景

- 语义搜索
- 推荐系统
- 图像检索
- 异常检测',
  'Database',
  '["vector-database", "embedding", "similarity-search", "ai"]'::JSONB,
  '向量数据库的核心原理和应用场景'
);

-- ============================================================
-- 12. 创建统计和监控函数
-- ============================================================

-- 获取表的大小信息
CREATE OR REPLACE FUNCTION get_knowledge_vault_size()
RETURNS TABLE (
  table_size TEXT,
  index_size TEXT,
  total_size TEXT,
  row_count BIGINT
)
LANGUAGE SQL
STABLE
AS $$
  SELECT 
    pg_size_pretty(pg_total_relation_size('knowledge_vault')) as table_size,
    pg_size_pretty(pg_indexes_size('knowledge_vault')) as index_size,
    pg_size_pretty(pg_total_relation_size('knowledge_vault') + pg_indexes_size('knowledge_vault')) as total_size,
    (SELECT COUNT(*) FROM knowledge_vault) as row_count;
$$;

-- 获取索引使用统计
CREATE OR REPLACE FUNCTION get_index_usage_stats()
RETURNS TABLE (
  index_name TEXT,
  index_scans BIGINT,
  tuples_read BIGINT,
  tuples_fetched BIGINT
)
LANGUAGE SQL
STABLE
AS $$
  SELECT 
    indexrelname::TEXT as index_name,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
  FROM pg_stat_user_indexes
  WHERE relname = 'knowledge_vault'
  ORDER BY idx_scan DESC;
$$;

-- ============================================================
-- 完成！
-- ============================================================

-- 添加注释
COMMENT ON TABLE knowledge_vault IS 'AICatPin 知识库存储表，包含笔记内容、分类、标签和向量嵌入';
COMMENT ON COLUMN knowledge_vault.id IS '唯一标识符，UUID 类型';
COMMENT ON COLUMN knowledge_vault.title IS '笔记标题';
COMMENT ON COLUMN knowledge_vault.content IS '原始 Markdown 内容';
COMMENT ON COLUMN knowledge_vault.category IS '分类名称，强约束非空';
COMMENT ON COLUMN knowledge_vault.tags IS '标签数组，JSONB 格式';
COMMENT ON COLUMN knowledge_vault.summary IS 'AI 生成的摘要';
COMMENT ON COLUMN knowledge_vault.embedding IS '1024 维向量嵌入，用于语义搜索';
COMMENT ON COLUMN knowledge_vault.created_at IS '创建时间';
COMMENT ON COLUMN knowledge_vault.updated_at IS '最后更新时间';

COMMENT ON FUNCTION match_notes IS '混合检索函数：支持向量相似度搜索，可选按分类和标签过滤';
COMMENT ON FUNCTION get_categories IS '获取所有分类及其笔记数量';
COMMENT ON FUNCTION get_all_tags IS '获取所有标签及其使用次数';
COMMENT ON FUNCTION search_notes_by_tag IS '按标签搜索笔记';
COMMENT ON FUNCTION search_notes_by_category IS '按分类搜索笔记';
COMMENT ON FUNCTION full_text_search IS '全文搜索函数';

-- 输出完成消息
DO $$
BEGIN
  RAISE NOTICE '✅ knowledge_vault 表创建完成';
  RAISE NOTICE '✅ 索引创建完成';
  RAISE NOTICE '✅ match_notes 函数创建完成';
  RAISE NOTICE '✅ 示例数据插入完成';
  RAISE NOTICE '🚀 数据库准备就绪！';
END $$;