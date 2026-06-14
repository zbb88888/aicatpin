# AICatPin 开发指南

## 项目设置完成

✅ 已创建以下文件：
- `README.md` - 项目概述和快速开始
- `ARCHITECTURE.md` - 详细架构文档
- `.pi/prompts/project.md` - pi 提示词模板
- `.pi/config.json` - pi 配置文件

## 下一步开发计划

### 1. 初始化项目结构
```bash
# 创建 Tauri + React 项目
npm create tauri-app@latest aicatpin -- --template react-ts

# 或者手动设置
mkdir -p src/{components,hooks,lib,types,styles}
mkdir -p src-tauri/src
mkdir -p supabase/{migrations,seed}
```

### 2. 安装核心依赖
```bash
# 前端依赖
npm install @supabase/supabase-js @tiptap/react @tiptap/starter-kit
npm install -D tailwindcss postcss autoprefixer
npm install class-variance-authority clsx tailwind-merge

# Tauri 依赖
cd src-tauri
cargo add tauri serde serde_json
```

### 3. 配置开发环境

#### Supabase 本地开发
```bash
# 安装 Supabase CLI
npm install -g supabase

# 初始化本地开发环境
supabase init
supabase start
```

#### Ollama 设置
```bash
# 安装 Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# 下载模型
ollama pull llama2
ollama pull nomic-embed-text
```

### 4. 数据库设计

#### 核心表结构
```sql
-- 命名空间表
CREATE TABLE namespaces (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 笔记表
CREATE TABLE notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  content TEXT,
  namespace_id UUID REFERENCES namespaces(id),
  tags TEXT[] DEFAULT '{}',
  embedding VECTOR(1536), -- 用于语义搜索
  summary TEXT, -- AI生成的摘要
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 标签表
CREATE TABLE tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  color VARCHAR(7) DEFAULT '#3B82F6',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 5. 第一个功能：笔记列表

创建基础的笔记CRUD功能：
1. 笔记列表组件
2. 笔记编辑器组件
3. 命名空间选择器
4. 标签管理

## 开发原则提醒

### ❌ 绝对不要
1. 创建传统文件树UI
2. 在Rust中实现业务逻辑
3. 使用双窗格Markdown编辑器
4. 创建深层目录结构

### ✅ 始终要
1. 使用扁平命名空间+标签
2. 所有数据存储在PostgreSQL
3. AI功能通过本地Ollama
4. 使用TypeScript严格模式
5. 使用React函数式组件+Hooks

## 工具和资源

### 开发工具
- **VS Code** + 扩展：
  - Tailwind CSS IntelliSense
  - TypeScript Vue Plugin (Volar)
  - Tauri Extension
  - Supabase Extension

### 参考文档
- [Tauri v2 文档](https://tauri.app/v2/)
- [Supabase 文档](https://supabase.com/docs)
- [TipTap 文档](https://tiptap.dev/)
- [Ollama API](https://github.com/ollama/ollama/blob/main/docs/api.md)

## 调试技巧

### 查看数据库
```bash
# 连接到本地 Supabase 数据库
supabase db dump
# 或使用 DBeaver/pgAdmin 连接
```

### 测试 Ollama
```bash
# 测试 Ollama API
curl http://localhost:11434/api/generate -d '{
  "model": "llama2",
  "prompt": "Hello, how are you?",
  "stream": false
}'
```

### Tauri 开发
```bash
# 开发模式
npm run tauri dev

# 构建应用
npm run tauri build
```