-- AICatPin Knowledge Vault 测试脚本
-- 运行此脚本以验证数据库迁移是否成功

-- ============================================================
-- 1. 测试表创建
-- ============================================================

DO $$
DECLARE
  table_exists BOOLEAN;
BEGIN
  -- 检查表是否存在
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'knowledge_vault'
  ) INTO table_exists;
  
  IF table_exists THEN
    RAISE NOTICE '✅ knowledge_vault 表存在';
  ELSE
    RAISE EXCEPTION '❌ knowledge_vault 表不存在';
  END IF;
END $$;

-- ============================================================
-- 2. 测试扩展
-- ============================================================

DO $$
DECLARE
  uuid_ext BOOLEAN;
  vector_ext BOOLEAN;
BEGIN
  -- 检查 UUID 扩展
  SELECT EXISTS (
    SELECT FROM pg_extension 
    WHERE extname = 'uuid-ossp'
  ) INTO uuid_ext;
  
  IF uuid_ext THEN
    RAISE NOTICE '✅ uuid-ossp 扩展已启用';
  ELSE
    RAISE EXCEPTION '❌ uuid-ossp 扩展未启用';
  END IF;
  
  -- 检查 pgvector 扩展
  SELECT EXISTS (
    SELECT FROM pg_extension 
    WHERE extname = 'vector'
  ) INTO vector_ext;
  
  IF vector_ext THEN
    RAISE NOTICE '✅ pgvector 扩展已启用';
  ELSE
    RAISE EXCEPTION '❌ pgvector 扩展未启用';
  END IF;
END $$;

-- ============================================================
-- 3. 测试索引
-- ============================================================

DO $$
DECLARE
  gin_index BOOLEAN;
  hnsw_index BOOLEAN;
  btree_category BOOLEAN;
  btree_created BOOLEAN;
  btree_updated BOOLEAN;
BEGIN
  -- 检查 GIN 索引
  SELECT EXISTS (
    SELECT FROM pg_indexes 
    WHERE tablename = 'knowledge_vault' 
    AND indexname = 'idx_knowledge_vault_tags'
  ) INTO gin_index;
  
  IF gin_index THEN
    RAISE NOTICE '✅ GIN 索引 (tags) 存在';
  ELSE
    RAISE EXCEPTION '❌ GIN 索引 (tags) 不存在';
  END IF;
  
  -- 检查 HNSW 索引
  SELECT EXISTS (
    SELECT FROM pg_indexes 
    WHERE tablename = 'knowledge_vault' 
    AND indexname = 'idx_knowledge_vault_embedding'
  ) INTO hnsw_index;
  
  IF hnsw_index THEN
    RAISE NOTICE '✅ HNSW 索引 (embedding) 存在';
  ELSE
    RAISE EXCEPTION '❌ HNSW 索引 (embedding) 不存在';
  END IF;
  
  -- 检查 B-tree 索引
  SELECT EXISTS (
    SELECT FROM pg_indexes 
    WHERE tablename = 'knowledge_vault' 
    AND indexname = 'idx_knowledge_vault_category'
  ) INTO btree_category;
  
  SELECT EXISTS (
    SELECT FROM pg_indexes 
    WHERE tablename = 'knowledge_vault' 
    AND indexname = 'idx_knowledge_vault_created_at'
  ) INTO btree_created;
  
  SELECT EXISTS (
    SELECT FROM pg_indexes 
    WHERE tablename = 'knowledge_vault' 
    AND indexname = 'idx_knowledge_vault_updated_at'
  ) INTO btree_updated;
  
  IF btree_category AND btree_created AND btree_updated THEN
    RAISE NOTICE '✅ B-tree 索引存在';
  ELSE
    RAISE EXCEPTION '❌ B-tree 索引不完整';
  END IF;
END $$;

-- ============================================================
-- 4. 测试函数
-- ============================================================

DO $$
DECLARE
  match_notes_exists BOOLEAN;
  get_categories_exists BOOLEAN;
  get_all_tags_exists BOOLEAN;
  search_by_tag_exists BOOLEAN;
  search_by_category_exists BOOLEAN;
  full_text_search_exists BOOLEAN;
BEGIN
  -- 检查 match_notes 函数
  SELECT EXISTS (
    SELECT FROM information_schema.routines 
    WHERE routine_schema = 'public' 
    AND routine_name = 'match_notes'
  ) INTO match_notes_exists;
  
  IF match_notes_exists THEN
    RAISE NOTICE '✅ match_notes 函数存在';
  ELSE
    RAISE EXCEPTION '❌ match_notes 函数不存在';
  END IF;
  
  -- 检查其他函数
  SELECT EXISTS (
    SELECT FROM information_schema.routines 
    WHERE routine_schema = 'public' 
    AND routine_name = 'get_categories'
  ) INTO get_categories_exists;
  
  SELECT EXISTS (
    SELECT FROM information_schema.routines 
    WHERE routine_schema = 'public' 
    AND routine_name = 'get_all_tags'
  ) INTO get_all_tags_exists;
  
  SELECT EXISTS (
    SELECT FROM information_schema.routines 
    WHERE routine_schema = 'public' 
    AND routine_name = 'search_notes_by_tag'
  ) INTO search_by_tag_exists;
  
  SELECT EXISTS (
    SELECT FROM information_schema.routines 
    WHERE routine_schema = 'public' 
    AND routine_name = 'search_notes_by_category'
  ) INTO search_by_category_exists;
  
  SELECT EXISTS (
    SELECT FROM information_schema.routines 
    WHERE routine_schema = 'public' 
    AND routine_name = 'full_text_search'
  ) INTO full_text_search_exists;
  
  IF get_categories_exists AND get_all_tags_exists AND 
     search_by_tag_exists AND search_by_category_exists AND 
     full_text_search_exists THEN
    RAISE NOTICE '✅ 所有辅助函数存在';
  ELSE
    RAISE EXCEPTION '❌ 部分辅助函数缺失';
  END IF;
END $$;

-- ============================================================
-- 5. 测试视图
-- ============================================================

DO $$
DECLARE
  stats_view BOOLEAN;
  category_view BOOLEAN;
  recent_view BOOLEAN;
BEGIN
  -- 检查视图
  SELECT EXISTS (
    SELECT FROM information_schema.views 
    WHERE table_schema = 'public' 
    AND table_name = 'knowledge_vault_stats'
  ) INTO stats_view;
  
  SELECT EXISTS (
    SELECT FROM information_schema.views 
    WHERE table_schema = 'public' 
    AND table_name = 'category_stats'
  ) INTO category_view;
  
  SELECT EXISTS (
    SELECT FROM information_schema.views 
    WHERE table_schema = 'public' 
    AND table_name = 'recent_notes'
  ) INTO recent_view;
  
  IF stats_view AND category_view AND recent_view THEN
    RAISE NOTICE '✅ 所有视图存在';
  ELSE
    RAISE EXCEPTION '❌ 部分视图缺失';
  END IF;
END $$;

-- ============================================================
-- 6. 测试数据插入
-- ============================================================

DO $$
DECLARE
  test_id UUID;
  test_count INTEGER;
BEGIN
  -- 插入测试数据
  INSERT INTO knowledge_vault (title, content, category, tags, summary)
  VALUES (
    '测试笔记',
    '# 测试内容

这是一个测试笔记，用于验证数据库功能。

## 功能测试

- [x] 表创建
- [x] 索引创建
- [x] 函数创建
- [ ] 向量搜索',
    'Testing',
    '["test", "database", "validation"]'::JSONB,
    '数据库功能测试笔记'
  )
  RETURNING id INTO test_id;
  
  RAISE NOTICE '✅ 测试数据插入成功，ID: %', test_id;
  
  -- 验证数据
  SELECT COUNT(*) INTO test_count
  FROM knowledge_vault
  WHERE id = test_id;
  
  IF test_count = 1 THEN
    RAISE NOTICE '✅ 数据验证成功';
  ELSE
    RAISE EXCEPTION '❌ 数据验证失败';
  END IF;
  
  -- 清理测试数据
  DELETE FROM knowledge_vault WHERE id = test_id;
  RAISE NOTICE '✅ 测试数据已清理';
END $$;

-- ============================================================
-- 7. 测试函数调用
-- ============================================================

DO $$
DECLARE
  categories_count INTEGER;
  tags_count INTEGER;
BEGIN
  -- 测试 get_categories 函数
  SELECT COUNT(*) INTO categories_count
  FROM get_categories();
  
  RAISE NOTICE '✅ get_categories 函数返回 % 个分类', categories_count;
  
  -- 测试 get_all_tags 函数
  SELECT COUNT(*) INTO tags_count
  FROM get_all_tags();
  
  RAISE NOTICE '✅ get_all_tags 函数返回 % 个标签', tags_count;
END $$;

-- ============================================================
-- 8. 测试示例数据
-- ============================================================

DO $$
DECLARE
  sample_count INTEGER;
BEGIN
  -- 检查示例数据
  SELECT COUNT(*) INTO sample_count
  FROM knowledge_vault;
  
  IF sample_count >= 5 THEN
    RAISE NOTICE '✅ 示例数据已插入 (% 条记录)', sample_count;
  ELSE
    RAISE NOTICE '⚠️  示例数据不足 (% 条记录，期望至少 5 条)', sample_count;
  END IF;
END $$;

-- ============================================================
-- 9. 测试约束
-- ============================================================

DO $$
BEGIN
  -- 测试非空约束
  BEGIN
    INSERT INTO knowledge_vault (title, category)
    VALUES (NULL, 'Test');
    RAISE EXCEPTION '❌ 非空约束未生效';
  EXCEPTION
    WHEN not_null_violation THEN
      RAISE NOTICE '✅ title 非空约束生效';
  END;
  
  -- 测试 category 非空约束
  BEGIN
    INSERT INTO knowledge_vault (title, category)
    VALUES ('Test', '');
    RAISE EXCEPTION '❌ category 非空约束未生效';
  EXCEPTION
    WHEN check_violation THEN
      RAISE NOTICE '✅ category 非空约束生效';
  END;
  
  -- 测试 tags 类型约束
  BEGIN
    INSERT INTO knowledge_vault (title, category, tags)
    VALUES ('Test', 'Test', '{"invalid": "object"}'::JSONB);
    RAISE EXCEPTION '❌ tags 类型约束未生效';
  EXCEPTION
    WHEN check_violation THEN
      RAISE NOTICE '✅ tags 类型约束生效';
  END;
END $$;

-- ============================================================
-- 10. 测试触发器
-- ============================================================

DO $$
DECLARE
  test_id UUID;
  initial_updated_at TIMESTAMP WITH TIME ZONE;
  final_updated_at TIMESTAMP WITH TIME ZONE;
BEGIN
  -- 插入测试数据
  INSERT INTO knowledge_vault (title, category, tags)
  VALUES ('触发器测试', 'Test', '[]'::JSONB)
  RETURNING id, updated_at INTO test_id, initial_updated_at;
  
  -- 等待一小段时间
  PERFORM pg_sleep(0.1);
  
  -- 更新数据
  UPDATE knowledge_vault 
  SET title = '触发器测试 - 已更新'
  WHERE id = test_id
  RETURNING updated_at INTO final_updated_at;
  
  -- 验证触发器
  IF final_updated_at > initial_updated_at THEN
    RAISE NOTICE '✅ updated_at 触发器工作正常';
  ELSE
    RAISE EXCEPTION '❌ updated_at 触发器未工作';
  END IF;
  
  -- 清理测试数据
  DELETE FROM knowledge_vault WHERE id = test_id;
END $$;

-- ============================================================
-- 11. 测试 RLS
-- ============================================================

DO $$
DECLARE
  rls_enabled BOOLEAN;
BEGIN
  -- 检查 RLS 是否启用
  SELECT relrowsecurity INTO rls_enabled
  FROM pg_class
  WHERE relname = 'knowledge_vault';
  
  IF rls_enabled THEN
    RAISE NOTICE '✅ 行级安全性 (RLS) 已启用';
  ELSE
    RAISE NOTICE '⚠️  行级安全性 (RLS) 未启用';
  END IF;
END $$;

-- ============================================================
-- 12. 测试权限
-- ============================================================

DO $$
DECLARE
  postgres_privileges BOOLEAN;
  anon_privileges BOOLEAN;
  authenticated_privileges BOOLEAN;
BEGIN
  -- 检查 postgres 权限
  SELECT EXISTS (
    SELECT FROM information_schema.table_privileges
    WHERE table_name = 'knowledge_vault'
    AND grantee = 'postgres'
    AND privilege_type = 'SELECT'
  ) INTO postgres_privileges;
  
  -- 检查 anon 权限
  SELECT EXISTS (
    SELECT FROM information_schema.table_privileges
    WHERE table_name = 'knowledge_vault'
    AND grantee = 'anon'
    AND privilege_type = 'SELECT'
  ) INTO anon_privileges;
  
  -- 检查 authenticated 权限
  SELECT EXISTS (
    SELECT FROM information_schema.table_privileges
    WHERE table_name = 'knowledge_vault'
    AND grantee = 'authenticated'
    AND privilege_type = 'SELECT'
  ) INTO authenticated_privileges;
  
  IF postgres_privileges AND anon_privileges AND authenticated_privileges THEN
    RAISE NOTICE '✅ 权限配置正确';
  ELSE
    RAISE NOTICE '⚠️  部分权限配置可能不完整';
  END IF;
END $$;

-- ============================================================
-- 测试完成
-- ============================================================

DO $$
BEGIN
  RAISE NOTICE '🎉 所有测试完成！';
  RAISE NOTICE '📊 数据库迁移验证成功';
  RAISE NOTICE '🚀 Knowledge Vault 已准备就绪';
END $$;