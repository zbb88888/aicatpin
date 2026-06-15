# AICatPin 架构文档

## 项目概述
AICatPin 是一个本地优先、AI原生的知识IDE。它摒弃了传统的多级文件夹结构，采用扁平的"类别（命名空间）+ 标签"架构。

## 核心架构原则

### 1. 数据架构
- **单一数据源 (SSOT):** 本地 Supabase (PostgreSQL 15+) 实例
- **AI 引擎:** 本地 Ollama 实例（端口 11434）
- **数据结构:** 扁平命名空间 + 标签系统，拒绝传统文件树

### 2. 技术栈
- **桌面框架:** Tauri v2 (Rust 后端)
- **前端:** React + Vite + Tailwind CSS + shadcn/ui
- **编辑器:** TipTap (无头、块级、类Notion，非双窗格Markdown)
- **数据库:** PostgreSQL 15+ (通过 Supabase)
- **AI集成:** Ollama API

### 3. 数据流
```
前端 UI → Ollama (摘要/嵌入) → Supabase (保存)
```

### 4. Rust 的职责
Tauri/Rust **仅用于**系统级I/O：
- 静默同步 PostgreSQL 行到本地 .md 文件（带YAML前端元数据）用于备份
- 窗口管理
- **不包含**业务逻辑

### 5. 代码风格
- **语言:** TypeScript (严格模式)
- **组件:** React 函数式组件 + Hooks
- **样式:** Tailwind CSS (最小化CSS)
- **UI库:** shadcn/ui

## 关键约束

### ❌ 禁止事项
1. **永不构建传统文件树UI** - 目录必须是扁平命名空间
2. **不在 Rust 中实现业务逻辑** - 业务逻辑属于 React/PostgreSQL
3. **不使用双窗格Markdown编辑器** - 使用块级TipTap编辑器

### ✅ 必须事项
1. **所有数据持久化通过 PostgreSQL**
2. **AI功能通过本地 Ollama 实例**
3. **系统级操作通过 Rust/Tauri**
4. **前端使用函数式组件和Hooks**

## 开发准备

### 环境要求
- Node.js 24+
- Rust 1.70+
- PostgreSQL 15+
- Ollama (本地运行在 11434 端口)
- Supabase CLI (可选，用于本地开发)

### 项目结构规划
```
aicatpin/
├── src-tauri/          # Tauri Rust 后端
├── src/                # React 前端
│   ├── components/     # React 组件
│   ├── hooks/          # 自定义 Hooks
│   ├── lib/            # 工具库
│   ├── types/          # TypeScript 类型定义
│   └── styles/         # 全局样式
├── public/             # 静态资源
├── supabase/           # Supabase 配置和迁移
└── docs/               # 项目文档
```

## 开发阶段

### Phase 1: 基础架构
1. 设置 Tauri v2 项目
2. 配置 React + Vite + Tailwind
3. 设置 PostgreSQL 和 Supabase
4. 基本的数据模型设计

### Phase 2: 核心功能
1. 实现扁平命名空间系统
2. 标签管理系统
3. TipTap 编辑器集成
4. 基本的 CRUD 操作

### Phase 3: AI 集成
1. Ollama API 集成
2. 内容摘要功能
3. 向量嵌入和语义搜索
4. 智能分类建议

### Phase 4: 高级功能
1. 本地备份同步 (Rust)
2. 高级搜索和过滤
3. 数据导入/导出
4. 性能优化