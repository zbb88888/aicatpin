# Knowledge Vault 数据库迁移

## 概述

这个迁移文件创建了 AICatPin 的核心数据表 `knowledge_vault`，用于存储知识笔记、分类、标签和向量嵌入。

## 特性

### 1. 表结构
- **id**: UUID 主键，自动生成
- **title**: 笔记标题（必需）
- **content**: 原始 Markdown 内容
- **category**: 分类名称（强约束，非空）
- **tags**: JSONB 数组，默认为空数组 `[]`
- **summary**: AI 生成的摘要
- **embedding**: 1024 维向量嵌入
- **created_at**: 创建时间
- **updated_at**: 更新时间（自动更新）

### 2. 索引优化
- **GIN 索引**: 用于 `tags` 字段，加速 JSONB 查询
- **HNSW 索引**: 用于 `embedding` 字段，使用余弦相似度
- **B-tree 索引**: 用于 `category`、`created_at`、`updated_at`

### 3. 核心函数

#### `match_notes` - 混合检索函数
```sql
SELECT * FROM match_notes(
  query_embedding := '[0.1, 0.2, ...]'::VECTOR(1024),
  filter_category := 'Programming',
  filter_tags := '["rust", "systems"]'::JSONB,
  match_count := 5,
  match_threshold := 0.5
);
```

**参数说明：**
- `query_embedding`: 查询向量（必需）
- `filter_category`: 按分类过滤（可选）
- `filter_tags`: 按标签过滤（可选）
- `match_count`: 返回结果数量（默认 5）
- `match_threshold`: 相似度阈值（默认 0.0）

**返回字段：**
- `id`: 笔记 ID
- `title`: 标题
- `content`: 内容
- `category`: 分类
- `tags`: 标签
- `summary`: 摘要
- `similarity`: 相似度分数（0-1）
- `created_at`: 创建时间
- `updated_at`: 更新时间

### 4. 辅助函数

#### `get_categories()` - 获取所有分类
```sql
SELECT * FROM get_categories();
-- 返回: category, count
```

#### `get_all_tags()` - 获取所有标签
```sql
SELECT * FROM get_all_tags();
-- 返回: tag, count
```

#### `search_notes_by_tag(tag)` - 按标签搜索
```sql
SELECT * FROM search_notes_by_tag('rust');
```

#### `search_notes_by_category(category)` - 按分类搜索
```sql
SELECT * FROM search_notes_by_category('Programming');
```

#### `full_text_search(query)` - 全文搜索
```sql
SELECT * FROM full_text_search('内存管理');
```

### 5. 视图

#### `knowledge_vault_stats` - 表统计
```sql
SELECT * FROM knowledge_vault_stats;
-- 返回: total_notes, total_categories, notes_with_embeddings, etc.
```

#### `category_stats` - 分类统计
```sql
SELECT * FROM category_stats;
-- 返回: category, note_count, embedded_count, etc.
```

#### `recent_notes` - 最近笔记
```sql
SELECT * FROM recent_notes;
```

## 使用示例

### 1. 插入笔记
```sql
INSERT INTO knowledge_vault (title, content, category, tags, summary)
VALUES (
  '新笔记标题',
  '# 笔记内容...',
  'Programming',
  '["rust", "programming"]'::JSONB,
  '笔记摘要'
);
```

### 2. 按标签查询
```sql
SELECT * FROM knowledge_vault
WHERE tags @> '["rust"]'::JSONB;
```

### 3. 按分类查询
```sql
SELECT * FROM knowledge_vault
WHERE category = 'Programming'
ORDER BY created_at DESC;
```

### 4. 语义搜索
```sql
-- 假设有一个查询向量
SELECT * FROM match_notes(
  query_embedding := (SELECT embedding FROM knowledge_vault WHERE id = 'some-uuid'),
  match_count := 10
);
```

### 5. 混合检索
```sql
SELECT * FROM match_notes(
  query_embedding := '[0.1, 0.2, ...]'::VECTOR(1024),
  filter_category := 'Programming',
  filter_tags := '["rust"]'::JSONB,
  match_count := 5
);
```

## 性能优化

### 索引调优
1. **HNSW 参数调整**:
   - `m`: 每个节点的最大连接数（默认 16）
   - `ef_construction`: 构建时的搜索范围（默认 64）
   - 值越大，索引越精确，但构建时间越长

2. **GIN 索引优化**:
   - 适用于 JSONB 数组查询
   - 支持 `@>`, `?`, `?|`, `?&` 操作符

### 查询优化
1. 使用 `EXPLAIN ANALYZE` 分析查询计划
2. 确保使用了正确的索引
3. 避免在 WHERE 子句中使用函数

## 限制和注意事项

1. **向量维度**: 固定为 1024 维，需要与嵌入模型匹配
2. **JSONB 格式**: tags 必须是字符串数组格式
3. **NULL 值**: embedding 为 NULL 的记录不会被包含在向量搜索中
4. **性能**: 大数据集上的向量搜索可能较慢，建议使用分页

## 扩展建议

1. **全文搜索**: 启用 `pg_trgm` 扩展支持模糊搜索
2. **分区**: 对于大数据集，考虑按时间或分类分区
3. **物化视图**: 对于频繁查询的统计信息
4. **触发器**: 自动更新摘要或重新计算嵌入

## 相关文件

- `001_create_knowledge_vault.sql`: 主迁移文件
- `../20240101000000_init/001_create_tables.sql`: 初始表结构

## 版本历史

- **v1.0.0** (2024-01-02): 初始版本
  - 创建 knowledge_vault 表
  - 创建所有索引
  - 实现 match_notes 函数
  - 添加示例数据