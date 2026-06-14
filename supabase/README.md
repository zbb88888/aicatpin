# Supabase 配置

本目录包含 Supabase 的配置和数据库迁移文件。

## 目录结构

```
supabase/
├── config.toml          # Supabase 配置
├── migrations/          # 数据库迁移
│   └── 20240101000000_init/
│       └── 001_create_tables.sql
└── seed/                # 种子数据
```

## 使用方法

### 启动本地 Supabase

```bash
# 安装 Supabase CLI
npm install -g supabase

# 初始化 Supabase（如果还没有初始化）
supabase init

# 启动本地 Supabase 服务
supabase start
```

### 数据库迁移

```bash
# 运行迁移
supabase db reset

# 或者推送迁移到远程
supabase db push
```

### 生成类型

```bash
# 生成 TypeScript 类型
supabase gen types typescript --local > src/types/supabase.ts
```

## 数据库架构

### 核心表

1. **namespaces** - 命名空间（扁平目录）
   - id: UUID
   - name: 唯一名称
   - description: 描述
   - created_at, updated_at: 时间戳

2. **notes** - 笔记
   - id: UUID
   - title: 标题
   - content: 内容
   - namespace_id: 关联命名空间
   - tags: 标签数组
   - embedding: 向量嵌入（用于语义搜索）
   - summary: AI生成的摘要
   - created_at, updated_at: 时间戳

3. **tags** - 标签定义
   - id: UUID
   - name: 唯一名称
   - color: 颜色代码
   - created_at: 时间戳

### 视图

- **notes_with_namespace**: 笔记与命名空间关联视图

### 函数

- **search_notes**: 语义搜索函数
- **search_notes_by_tag**: 按标签搜索函数

## 环境变量

在项目根目录的 `.env` 文件中配置：

```env
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## 生产环境

对于生产环境，需要：

1. 创建 Supabase 项目：https://supabase.com
2. 获取项目 URL 和 anon key
3. 更新环境变量
4. 运行迁移：`supabase db push`
5. 配置 RLS 策略（生产环境需要更严格的策略）