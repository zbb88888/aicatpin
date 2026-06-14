# useCatPinSave Hook

## 概述

`useCatPinSave` 是一个自定义 React Hook，实现了 AICatPin 的完整 AI 管道保存流程。

## 功能特性

### 1. AI 元数据提取
- 使用 Ollama qwen2.5:7b 模型
- 自动提取：标题、分类、标签、摘要
- 支持 JSON 格式输出

### 2. 向量嵌入生成
- 使用 nomic-embed-text 模型
- 生成 1024 维向量
- 用于语义搜索

### 3. 数据库存储
- 使用 Supabase 客户端
- 插入 knowledge_vault 表
- 支持完整元数据

### 4. 文件系统同步
- 调用 Tauri Rust Command
- 保存为 Markdown + YAML Front-matter
- 路径：`~/AICatPin_Vault/{category}/{title}.md`

## 使用方法

### 基本用法

```tsx
import { useCatPinSave } from '@/hooks/useCatPinSave'

function MyComponent() {
  const { 
    saveNote, 
    status, 
    progress, 
    error, 
    isSaving, 
    lastResult 
  } = useCatPinSave()

  const handleSave = async () => {
    const content = '你的笔记内容...'
    const result = await saveNote(content)
    
    if (result.success) {
      console.log('保存成功:', result.id)
      console.log('元数据:', result.metadata)
    } else {
      console.error('保存失败:', result.error)
    }
  }

  return (
    <div>
      <button onClick={handleSave} disabled={isSaving}>
        {isSaving ? '保存中...' : '保存'}
      </button>
      {progress && <p>{progress}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  )
}
```

### 在 CatPinEditor 中使用

```tsx
import { CatPinEditor } from '@/components/editor/CatPinEditor'

function EditorPage() {
  const handleSaveSuccess = (id: string) => {
    console.log('笔记保存成功，ID:', id)
  }

  const handleSaveError = (error: string) => {
    console.error('保存失败:', error)
  }

  return (
    <CatPinEditor
      onSaveSuccess={handleSaveSuccess}
      onSaveError={handleSaveError}
      placeholder="开始编辑..."
    />
  )
}
```

## API 参考

### 返回值

| 属性 | 类型 | 说明 |
|------|------|------|
| `saveNote` | `(content: string) => Promise<SaveResult>` | 保存笔记函数 |
| `status` | `SaveStatus` | 当前保存状态 |
| `progress` | `string` | 进度信息 |
| `error` | `string \| null` | 错误信息 |
| `isSaving` | `boolean` | 是否正在保存 |
| `lastResult` | `SaveResult \| null` | 上次保存结果 |
| `resetStatus` | `() => void` | 重置状态 |

### SaveStatus 类型

```typescript
type SaveStatus = 
  | 'idle'       // 空闲状态
  | 'extracting' // 提取元数据中
  | 'embedding'  // 生成向量中
  | 'saving'     // 保存数据库中
  | 'syncing'    // 同步文件系统中
  | 'success'    // 保存成功
  | 'error'      // 保存失败
```

### SaveResult 类型

```typescript
interface SaveResult {
  success: boolean
  id?: string
  error?: string
  metadata?: {
    title: string
    category: string
    tags: string[]
    summary: string
  }
  filePath?: string
}
```

## 工作流程

```
用户输入内容
    ↓
按下 Ctrl+S
    ↓
useCatPinSave.saveNote()
    ↓
┌─────────────────────────────────────┐
│ 步骤 1: 提取元数据                    │
│ - 调用 Ollama API                    │
│ - 提取 title, category, tags, summary │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ 步骤 2: 生成向量嵌入                  │
│ - 调用 Ollama Embedding API          │
│ - 生成 1024 维向量                    │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ 步骤 3: 保存到 Supabase               │
│ - 插入 knowledge_vault 表            │
│ - 包含所有元数据和向量                │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ 步骤 4: 同步到文件系统                │
│ - 调用 Tauri Rust Command            │
│ - 保存为 Markdown + YAML             │
│ - 路径: ~/AICatPin_Vault/...         │
└─────────────────────────────────────┘
    ↓
保存完成
```

## 错误处理

### Ollama 连接失败
```typescript
// 检查 Ollama 服务状态
const ollamaAvailable = await checkOllamaStatus()
if (!ollamaAvailable) {
  // 显示错误提示
  return { success: false, error: '无法连接到 Ollama 服务' }
}
```

### AI 提取失败
```typescript
// 使用默认值
const metadata = {
  title: content.substring(0, 50).replace(/[#\n]/g, '').trim() || 'Untitled',
  category: 'Other',
  tags: [],
  summary: content.substring(0, 150).replace(/[#\n]/g, '').trim(),
}
```

### 向量生成失败
```typescript
// 使用零向量（语义搜索将不可用）
const embedding = new Array(1024).fill(0)
```

### 文件同步失败
```typescript
// 不阻止保存流程，只记录警告
console.warn('笔记已保存到数据库，但文件同步失败')
```

## 依赖

### 前端依赖
- `@supabase/supabase-js` - Supabase 客户端
- `@tauri-apps/api/tauri` - Tauri API

### 后端依赖
- Ollama 服务 (http://127.0.0.1:11434)
- Supabase 本地实例
- Tauri 桌面应用

## 配置

### Ollama 模型
```typescript
const OLLAMA_MODEL = 'qwen2.5:7b'      // 元数据提取模型
const EMBEDDING_MODEL = 'nomic-embed-text' // 嵌入模型
const EMBEDDING_DIMENSION = 1024         // 向量维度
```

### Supabase 表
```sql
CREATE TABLE knowledge_vault (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT,
  category VARCHAR(100) NOT NULL,
  tags JSONB DEFAULT '[]',
  summary TEXT,
  embedding VECTOR(1024),
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
);
```

## 相关文件

- `src/hooks/useCatPinSave.ts` - Hook 实现
- `src/components/editor/CatPinEditor.tsx` - 编辑器组件
- `src-tauri/src/main.rs` - Rust Command 实现
- `src/types/tauri.ts` - TypeScript 类型定义

## 版本历史

- **v1.0.0** (2024-01-02)
  - 初始版本
  - 实现完整 AI 管道
  - 支持元数据提取、向量生成、数据库存储、文件同步