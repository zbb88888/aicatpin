-- AICatPin 数据库初始化
-- 创建扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- 命名空间表
CREATE TABLE namespaces (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 标签表
CREATE TABLE tags (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  color VARCHAR(7) DEFAULT '#3B82F6',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 笔记表
CREATE TABLE notes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  content TEXT,
  namespace_id UUID REFERENCES namespaces(id) ON DELETE CASCADE,
  tags TEXT[] DEFAULT '{}',
  embedding VECTOR(1536), -- 用于语义搜索
  summary TEXT, -- AI生成的摘要
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_notes_namespace_id ON notes(namespace_id);
CREATE INDEX idx_notes_tags ON notes USING GIN(tags);
CREATE INDEX idx_notes_created_at ON notes(created_at DESC);
CREATE INDEX idx_notes_updated_at ON notes(updated_at DESC);

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_namespaces_updated_at
    BEFORE UPDATE ON namespaces
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notes_updated_at
    BEFORE UPDATE ON notes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 插入默认命名空间
INSERT INTO namespaces (name, description) VALUES
  ('默认', '默认命名空间'),
  ('个人笔记', '个人学习笔记'),
  ('工作', '工作相关笔记');

-- 插入一些默认标签
INSERT INTO tags (name, color) VALUES
  ('重要', '#EF4444'),
  ('待办', '#F59E0B'),
  ('参考', '#10B981'),
  ('想法', '#8B5CF6'),
  ('技术', '#3B82F6');

-- 创建 RLS 策略（Row Level Security）
ALTER TABLE namespaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

-- 允许所有操作（本地开发，生产环境需要更严格的策略）
CREATE POLICY "Allow all operations" ON namespaces FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON notes FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON tags FOR ALL USING (true);

-- 创建视图：笔记与命名空间关联
CREATE VIEW notes_with_namespace AS
SELECT 
  n.id,
  n.title,
  n.content,
  n.tags,
  n.summary,
  n.created_at,
  n.updated_at,
  ns.name as namespace_name,
  ns.description as namespace_description
FROM notes n
LEFT JOIN namespaces ns ON n.namespace_id = ns.id;

-- 创建函数：语义搜索
CREATE OR REPLACE FUNCTION search_notes(
  query_embedding VECTOR(1536),
  match_threshold FLOAT DEFAULT 0.5,
  match_count INT DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  title VARCHAR(500),
  content TEXT,
  tags TEXT[],
  summary TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    n.id,
    n.title,
    n.content,
    n.tags,
    n.summary,
    1 - (n.embedding <=> query_embedding) as similarity
  FROM notes n
  WHERE 1 - (n.embedding <=> query_embedding) > match_threshold
  ORDER BY n.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- 创建函数：按标签搜索
CREATE OR REPLACE FUNCTION search_notes_by_tag(tag_name TEXT)
RETURNS TABLE (
  id UUID,
  title VARCHAR(500),
  content TEXT,
  tags TEXT[],
  summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    n.id,
    n.title,
    n.content,
    n.tags,
    n.summary,
    n.created_at
  FROM notes n
  WHERE tag_name = ANY(n.tags)
  ORDER BY n.created_at DESC;
END;
$$;

-- 授予权限
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;