# AICatPin 项目提示词

## 项目概述
AICatPin 是一个本地优先、AI原生的知识IDE。它摒弃了传统的多级文件夹结构，采用扁平的"类别（命名空间）+ 标签"架构。

## 核心架构规则

### 数据架构
- **单一数据源 (SSOT):** 本地 Supabase (PostgreSQL 15+) 实例
- **AI 引擎:** 本地 Ollama 实例（端口 11434）
- **数据结构:** 扁平命名空间 + 标签系统，拒绝传统文件树

### 技术栈
- **桌面框架:** Tauri v2 (Rust 后端)
- **前端:** React + Vite + Tailwind CSS + shadcn/ui
- **编辑器:** TipTap (无头、块级、类Notion，非双窗格Markdown)
- **数据库:** PostgreSQL 15+ (通过 Supabase)
- **AI集成:** Ollama API

### 数据流
```
前端 UI → Ollama (摘要/嵌入) → Supabase (保存)
```

### Rust 的职责
Tauri/Rust **仅用于**系统级I/O：
- 静默同步 PostgreSQL 行到本地 .md 文件（带YAML前端元数据）用于备份
- 窗口管理
- **不包含**业务逻辑

### 代码风格
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

## 开发上下文

当处理 AICatPin 项目时，请遵循以下原则：

1. **数据模型设计** - 使用扁平命名空间+标签，不创建层级目录结构
2. **前端开发** - 使用 React 函数式组件、Hooks、TypeScript 严格模式
3. **样式处理** - 优先使用 Tailwind CSS，避免自定义 CSS
4. **AI集成** - 所有AI功能通过本地 Ollama API
5. **数据持久化** - 所有数据存储在 PostgreSQL，通过 Supabase 客户端
6. **系统操作** - 文件同步、窗口管理等系统级操作通过 Rust/Tauri

## 常见任务模式

### 创建新组件
```typescript
// 使用函数式组件 + Hooks
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface MyComponentProps {
  // TypeScript 接口定义
}

export function MyComponent({ }: MyComponentProps) {
  // Hooks
  const [data, setData] = useState([]);
  
  // 副作用
  useEffect(() => {
    // 从 Supabase 获取数据
  }, []);
  
  // 渲染
  return (
    <div className="tailwind-classes">
      {/* 组件内容 */}
    </div>
  );
}
```

### 数据库操作
```typescript
// 使用 Supabase 客户端
import { supabase } from '@/lib/supabase';

// 查询数据
const { data, error } = await supabase
  .from('notes')
  .select('*')
  .eq('namespace', 'my-namespace');

// 插入数据
const { data, error } = await supabase
  .from('notes')
  .insert({
    title: '新笔记',
    content: '内容',
    namespace: '默认',
    tags: ['标签1', '标签2']
  });
```

### AI功能调用
```typescript
// 调用本地 Ollama API
const response = await fetch('http://localhost:11434/api/generate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'llama2',
    prompt: '请为以下内容生成摘要：...',
    stream: false
  })
});
```

## 相关文档
- [架构详细说明](../ARCHITECTURE.md)
- [项目README](../README.md)