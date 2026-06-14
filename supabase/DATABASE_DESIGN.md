# AICatPin 数据库设计文档

## 概述

AICatPin 使用 PostgreSQL 15+ 作为单一数据源 (SSOT)，通过 Supabase 提供实时数据库服务。本文档描述了数据库的设计、架构和最佳实践。

## 架构原则

### 1. 扁平命名空间
- **拒绝传统文件树**：不使用多级目录结构
- **类别 (Category)**：扁平的命名空间，每个笔记属于一个类别
- **标签 (Tags)**：JSONB 数组，支持多标签分类

### 2. 向量搜索
- **pgvector 扩展**：支持高维向量存储和搜索
- **HNSW 索引**：高效近似最近邻搜索
- **余弦相似度**：衡量语义相似性

### 3. 混合检索
- **向量搜索**：基于语义相似性
- **全文搜索**：基于关键词匹配
- **结构化查询**：基于分类和标签过滤

## 表结构

### knowledge_vault 表

```sql
CREATE TABLE knowledge_vault (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT,
  category VARCHAR(100) NOT NULL,
  tags JSONB DEFAULT '[]'::JSONB,
  summary TEXT,
  embedding VECTOR(1024),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 字段说明

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | UUID | PRIMARY KEY | 唯一标识符，自动生成 |
| `title` | TEXT | NOT NULL | 笔记标题 |
| `content` | TEXT | - | 原始 Markdown 内容 |
| `category` | VARCHAR(100) | NOT NULL | 分类名称（强约束） |
| `tags` | JSONB | DEFAULT '[]' | 标签数组 |
| `summary` | TEXT | - | AI 生成的摘要 |
| `embedding` | VECTOR(1024) | - | 1024 维向量嵌入 |
| `created_at` | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | 创建时间 |
| `updated_at` | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | 更新时间（自动更新） |

#### 约束

1. **tags_is_array**: 确保 tags 是 JSONB 数组类型
2. **category_not_empty**: 确保 category 不为空字符串

### 索引设计

#### 1. GIN 索引 (tags)
```sql
CREATE INDEX idx_knowledge_vault_tags 
ON knowledge_vault USING GIN (tags);
```
- **用途**: 加速 JSONB 数组查询
- **支持操作**: `@>`, `?`, `?|`, `?&`
- **示例**: `WHERE tags @> '["rust"]'::JSONB`

#### 2. HNSW 索引 (embedding)
```sql
CREATE INDEX idx_knowledge_vault_embedding 
ON knowledge_vault USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);
```
- **用途**: 高效近似最近邻搜索
- **参数**:
  - `m`: 每个节点的最大连接数 (默认 16)
  - `ef_construction`: 构建时的搜索范围 (默认 64)
- **距离度量**: 余弦相似度 (`vector_cosine_ops`)

#### 3. B-tree 索引
```sql
CREATE INDEX idx_knowledge_vault_category 
ON knowledge_vault USING BTREE (category);

CREATE INDEX idx_knowledge_vault_created_at 
ON knowledge_vault USING BTREE (created_at DESC);

CREATE INDEX idx_knowledge_vault_updated_at 
ON knowledge_vault USING BTREE (updated_at DESC);
```
- **用途**: 加速精确匹配和范围查询
- **排序**: 支持升序和降序

## 核心函数

### 1. match_notes - 混合检索函数

```sql
CREATE OR REPLACE FUNCTION match_notes(
  query_embedding VECTOR(1024),
  filter_category VARCHAR(100) DEFAULT NULL,
  filter_tags JSONB DEFAULT NULL,
  match_count INT DEFAULT 5,
  match_threshold FLOAT DEFAULT 0.0
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
```

#### 使用示例

```sql
-- 基本向量搜索
SELECT * FROM match_notes(
  query_embedding := '[0.1, 0.2, ...]'::VECTOR(1024),
  match_count := 10
);

-- 按分类过滤
SELECT * FROM match_notes(
  query_embedding := '[0.1, 0.2, ...]'::VECTOR(1024),
  filter_category := 'Programming',
  match_count := 5
);

-- 按标签过滤
SELECT * FROM match_notes(
  query_embedding := '[0.1, 0.2, ...]'::VECTOR(1024),
  filter_tags := '["rust", "systems"]'::JSONB,
  match_count := 5
);

-- 混合过滤
SELECT * FROM match_notes(
  query_embedding := '[0.1, 0.2, ...]'::VECTOR(1024),
  filter_category := 'Programming',
  filter_tags := '["rust"]'::JSONB,
  match_count := 5,
  match_threshold := 0.5
);
```

### 2. get_categories - 获取所有分类

```sql
SELECT * FROM get_categories();
-- 返回: category, count
```

### 3. get_all_tags - 获取所有标签

```sql
SELECT * FROM get_all_tags();
-- 返回: tag, count
```

### 4. search_notes_by_tag - 按标签搜索

```sql
SELECT * FROM search_notes_by_tag('rust', 20);
```

### 5. search_notes_by_category - 按分类搜索

```sql
SELECT * FROM search_notes_by_category('Programming', 20);
```

### 6. full_text_search - 全文搜索

```sql
SELECT * FROM full_text_search('内存管理', 20);
```

## 视图

### 1. knowledge_vault_stats - 表统计

```sql
SELECT * FROM knowledge_vault_stats;
-- 返回: total_notes, total_categories, notes_with_embeddings, etc.
```

### 2. category_stats - 分类统计

```sql
SELECT * FROM category_stats;
-- 返回: category, note_count, embedded_count, etc.
```

### 3. recent_notes - 最近笔记

```sql
SELECT * FROM recent_notes;
-- 返回: 最近更新的 50 条笔记
```

## 安全设计

### 行级安全性 (RLS)

```sql
ALTER TABLE knowledge_vault ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on knowledge_vault" 
ON knowledge_vault 
FOR ALL 
USING (true)
WITH CHECK (true);
```

### 权限配置

```sql
-- postgres 用户：完全权限
GRANT ALL PRIVILEGES ON TABLE knowledge_vault TO postgres;

-- anon 用户：只读权限
GRANT SELECT ON TABLE knowledge_vault TO anon;

-- authenticated 用户：读写权限
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE knowledge_vault TO authenticated;
```

## 性能优化

### 1. 索引调优

#### HNSW 参数调整
```sql
-- 更高的精度（更慢）
CREATE INDEX idx_knowledge_vault_embedding 
ON knowledge_vault USING hnsw (embedding vector_cosine_ops)
WITH (m = 32, ef_construction = 128);

-- 更快的速度（精度稍低）
CREATE INDEX idx_knowledge_vault_embedding 
ON knowledge_vault USING hnsw (embedding vector_cosine_ops)
WITH (m = 8, ef_construction = 32);
```

#### 查询时参数调整
```sql
-- 设置搜索范围（影响精度和速度）
SET hnsw.ef_search = 100;

-- 查看当前设置
SHOW hnsw.ef_search;
```

### 2. 查询优化

#### 使用 EXPLAIN ANALYZE
```sql
EXPLAIN ANALYZE
SELECT * FROM match_notes(
  query_embedding := '[0.1, 0.2, ...]'::VECTOR(1024),
  match_count := 10
);
```

#### 避免全表扫描
```sql
-- 好：使用索引
SELECT * FROM knowledge_vault 
WHERE category = 'Programming';

-- 差：函数调用导致全表扫描
SELECT * FROM knowledge_vault 
WHERE UPPER(category) = 'PROGRAMMING';
```

### 3. 连接池配置

在 Supabase 控制台中配置：
- **最大连接数**: 50-100
- **连接超时**: 30 秒
- **空闲超时**: 300 秒

## 数据迁移

### 迁移文件结构

```
supabase/migrations/
├── 20240101000000_init/
│   └── 001_create_tables.sql
└── 20240102000000_create_knowledge_vault/
    ├── 001_create_knowledge_vault.sql
    └── README.md
```

### 运行迁移

```bash
# 重置数据库（开发环境）
supabase db reset

# 推送迁移到远程
supabase db push

# 生成 TypeScript 类型
supabase gen types typescript --local > src/types/supabase.ts
```

## 最佳实践

### 1. 数据插入

```sql
-- 使用参数化查询
INSERT INTO knowledge_vault (title, content, category, tags, summary)
VALUES ($1, $2, $3, $4, $5);

-- 批量插入
INSERT INTO knowledge_vault (title, content, category, tags, summary)
VALUES 
  ('标题1', '内容1', 'Category1', '["tag1"]'::JSONB, '摘要1'),
  ('标题2', '内容2', 'Category2', '["tag2"]'::JSONB, '摘要2');
```

### 2. 向量生成

```typescript
// 使用 Ollama 生成嵌入
async function generateEmbedding(text: string): Promise<number[]> {
  const response = await fetch('http://localhost:11434/api/embeddings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'nomic-embed-text',
      prompt: text,
    }),
  });
  
  const data = await response.json();
  return data.embedding;
}
```

### 3. 混合检索策略

```typescript
// 1. 先进行向量搜索
const vectorResults = await searchNotes({
  query_embedding: embedding,
  match_count: 20,
  match_threshold: 0.5,
});

// 2. 再进行结构化过滤
const filteredResults = vectorResults.filter(note => {
  if (category && note.category !== category) return false;
  if (tags && !tags.some(tag => note.tags.includes(tag))) return false;
  return true;
});

// 3. 返回 Top 5
return filteredResults.slice(0, 5);
```

## 监控和维护

### 1. 查看表大小

```sql
SELECT * FROM get_knowledge_vault_size();
```

### 2. 查看索引使用情况

```sql
SELECT * FROM get_index_usage_stats();
```

### 3. 分析查询性能

```sql
-- 查看慢查询
SELECT query, calls, mean_time, total_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

### 4. 清理孤立数据

```sql
-- 删除无嵌入的旧笔记
DELETE FROM knowledge_vault 
WHERE embedding IS NULL 
AND created_at < NOW() - INTERVAL '30 days';
```

## 扩展建议

### 1. 分区策略

对于大数据集，考虑按时间分区：

```sql
CREATE TABLE knowledge_vault (
  -- ... 字段定义
) PARTITION BY RANGE (created_at);

-- 创建月度分区
CREATE TABLE knowledge_vault_2024_01 PARTITION OF knowledge_vault
FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
```

### 2. 物化视图

对于频繁查询的统计信息：

```sql
CREATE MATERIALIZED VIEW mv_category_stats AS
SELECT * FROM category_stats;

-- 定期刷新
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_category_stats;
```

### 3. 触发器扩展

自动处理嵌入生成：

```sql
CREATE OR REPLACE FUNCTION auto_generate_embedding()
RETURNS TRIGGER AS $$
BEGIN
  -- 调用外部 API 生成嵌入
  -- NEW.embedding = generate_embedding(NEW.content);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

## 故障排除

### 1. 索引重建

```sql
-- 重建 HNSW 索引
REINDEX INDEX idx_knowledge_vault_embedding;

-- 重建 GIN 索引
REINDEX INDEX idx_knowledge_vault_tags;
```

### 2. 统计信息更新

```sql
-- 更新表统计信息
ANALYZE knowledge_vault;
```

### 3. 连接问题

```sql
-- 查看活动连接
SELECT * FROM pg_stat_activity;

-- 终止空闲连接
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE state = 'idle'
AND query_start < NOW() - INTERVAL '10 minutes';
```

## 版本历史

- **v1.0.0** (2024-01-02)
  - 创建 knowledge_vault 表
  - 实现向量搜索功能
  - 添加混合检索函数
  - 配置索引和安全性

## 相关文档

- [Supabase 文档](https://supabase.com/docs)
- [pgvector 文档](https://github.com/pgvector/pgvector)
- [PostgreSQL 全文搜索](https://www.postgresql.org/docs/current/textsearch.html)

---

**最后更新**: 2024-01-02  
**维护者**: AICatPin Team