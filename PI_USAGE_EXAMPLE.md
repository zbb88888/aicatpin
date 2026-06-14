# Pi 提示词模板使用示例

## 已配置的提示词模板

AICatPin 项目已配置以下提示词模板：

### `/project` - 项目上下文
**文件位置：** `.pi/prompts/project.md`
**描述：** AICatPin 项目架构和开发指南

**使用方法：**
```
/project
```

**效果：**
- 加载完整的项目架构信息
- 包含技术栈、数据流、开发原则
- 提供代码示例和最佳实践

## 使用场景示例

### 1. 创建新组件时
```
/project
创建一个笔记列表组件，显示所有笔记并支持搜索功能
```

### 2. 设计数据库查询时
```
/project
设计一个查询，获取指定命名空间下的所有笔记，并按更新时间排序
```

### 3. 实现AI功能时
```
/project
实现一个使用Ollama API生成笔记摘要的功能
```

### 4. 调试问题时
```
/project
笔记编辑器无法保存内容，请帮我排查问题
```

## 提示词模板内容概览

`/project` 模板包含以下关键信息：

### 核心架构规则
- 单一数据源：本地 Supabase (PostgreSQL 15+)
- AI 引擎：本地 Ollama 实例（端口 11434）
- 数据结构：扁平命名空间 + 标签系统

### 技术栈
- 桌面框架：Tauri v2 (Rust 后端)
- 前端：React + Vite + Tailwind CSS + shadcn/ui
- 编辑器：TipTap (无头、块级、类Notion)

### 数据流
```
前端 UI → Ollama (摘要/嵌入) → Supabase (保存)
```

### 代码示例
- React 函数式组件 + Hooks
- Supabase 数据库操作
- Ollama API 调用

## 自定义提示词模板

您可以根据需要创建自己的提示词模板：

### 创建新模板
1. 在 `.pi/prompts/` 目录下创建 `.md` 文件
2. 添加 YAML frontmatter（可选）
3. 编写模板内容

### 示例模板
```markdown
---
description: 创建新的React组件
argument-hint: "<组件名> [功能描述]"
---
创建一个名为 $1 的 React 组件。

要求：
- 使用 TypeScript
- 使用函数式组件 + Hooks
- 使用 Tailwind CSS 样式
- 包含必要的类型定义

功能描述：$@
```

### 使用自定义模板
```
/component NoteList "显示笔记列表，支持搜索和过滤"
```

## 最佳实践

### 1. 使用项目上下文
在开始新任务时，先加载项目上下文：
```
/project
```

### 2. 明确需求
描述具体的功能需求和技术要求：
```
/project
实现一个语义搜索功能，使用 Ollama 的 nomic-embed-text 模型生成嵌入向量，
然后使用 PostgreSQL 的 pgvector 扩展进行相似度搜索
```

### 3. 遵循架构原则
确保代码符合项目架构：
- 使用扁平命名空间 + 标签
- 业务逻辑在 React/PostgreSQL
- Rust 仅用于系统级操作

### 4. 代码风格
遵循项目代码风格：
- TypeScript 严格模式
- React 函数式组件 + Hooks
- Tailwind CSS 样式

## 调试技巧

### 查看可用模板
在 pi 中输入 `/` 查看所有可用的提示词模板。

### 模板参数
使用参数传递具体需求：
```
/project 创建一个支持拖拽排序的标签管理组件
```

### 组合使用
可以组合多个模板或添加额外上下文：
```
/project
参考 ARCHITECTURE.md 中的数据模型设计，
实现笔记的 CRUD 操作
```

## 相关文档

- [Pi 提示词模板文档](https://github.com/earendil-works/pi-coding-agent/blob/main/docs/prompt-templates.md)
- [项目架构文档](./ARCHITECTURE.md)
- [开发指南](./DEVELOPMENT.md)

---

**提示：** 使用 `@project` 可以快速引用项目上下文，获得更准确的帮助。