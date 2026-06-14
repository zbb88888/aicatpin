# AICatPin 快速开始指南

## 🎯 项目已初始化完成！

您的 AICatPin 项目已经设置好了基本结构，包含：

### ✅ 已创建的文件

**文档文件：**
- `README.md` - 项目概述和快速开始
- `ARCHITECTURE.md` - 详细架构文档
- `DEVELOPMENT.md` - 开发指南
- `QUICKSTART.md` - 本文件

**配置文件：**
- `package.json` - 项目依赖和脚本
- `tsconfig.json` - TypeScript 配置
- `vite.config.ts` - Vite 构建配置
- `tailwind.config.js` - Tailwind CSS 配置
- `.pi/prompts/project.md` - pi 提示词模板

**源代码文件：**
- `src/App.tsx` - 主应用组件
- `src/main.tsx` - 应用入口
- `src/styles/globals.css` - 全局样式
- `src/types/index.ts` - TypeScript 类型定义
- `src/lib/supabase.ts` - Supabase 客户端

**Tauri 文件：**
- `src-tauri/` - Tauri 桌面应用配置

**数据库文件：**
- `supabase/migrations/` - 数据库迁移脚本

## 🚀 下一步操作

### 1. 安装 Rust (如果尚未安装)
```bash
# 安装 Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# 配置环境变量
source $HOME/.cargo/env

# 验证安装
rustc --version
cargo --version
```

### 2. 安装项目依赖
```bash
# 安装 Node.js 依赖
npm install

# 或使用 yarn
yarn install
```

### 3. 安装 Supabase CLI
```bash
# 使用 npm 安装
npm install -g supabase

# 或使用 Homebrew (macOS)
brew install supabase/tap/supabase
```

### 4. 安装 Ollama
```bash
# macOS/Linux
curl -fsSL https://ollama.ai/install.sh | sh

# 启动 Ollama 服务
ollama serve

# 在另一个终端下载模型
ollama pull llama2
ollama pull nomic-embed-text
```

### 5. 配置环境变量
编辑 `.env` 文件，填入您的配置：
```env
# Supabase 配置
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=your-anon-key

# Ollama 配置
VITE_OLLAMA_URL=http://localhost:11434
```

### 6. 启动 Supabase
```bash
# 初始化 Supabase (如果还没有)
supabase init

# 启动本地 Supabase 服务
supabase start

# 查看状态
supabase status
```

### 7. 开始开发
```bash
# 启动开发服务器
npm run dev

# 启动 Tauri 桌面应用
npm run tauri dev

# 或者同时启动
npm run tauri dev
```

## 📁 项目结构

```
aicatpin/
├── src/                    # React 前端源代码
│   ├── components/         # React 组件
│   ├── hooks/             # 自定义 Hooks
│   ├── lib/               # 工具库
│   ├── types/             # TypeScript 类型
│   └── styles/            # 样式文件
├── src-tauri/             # Tauri Rust 后端
├── supabase/              # Supabase 配置和迁移
├── public/                # 静态资源
├── docs/                  # 项目文档
├── .pi/                   # pi 配置和提示词
└── 配置文件               # 各种配置文件
```

## 🎨 开发第一个功能

### 创建笔记列表组件
```typescript
// src/components/notes/NoteList.tsx
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Note } from '@/types';

export function NoteList() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch (error) {
      console.error('Error fetching notes:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>加载中...</div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">笔记列表</h2>
      <div className="grid gap-4">
        {notes.map((note) => (
          <div key={note.id} className="p-4 border rounded-lg">
            <h3 className="font-semibold">{note.title}</h3>
            <p className="text-sm text-muted-foreground">
              {note.summary || '无摘要'}
            </p>
            <div className="flex gap-2 mt-2">
              {note.tags.map((tag) => (
                <span key={tag} className="px-2 py-1 text-xs bg-secondary rounded">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

## 🔧 常用命令

```bash
# 开发
npm run dev              # 启动 Vite 开发服务器
npm run tauri dev        # 启动 Tauri 桌面应用
npm run build            # 构建前端
npm run tauri build      # 构建桌面应用

# 数据库
supabase start           # 启动 Supabase
supabase stop            # 停止 Supabase
supabase db reset        # 重置数据库
supabase status          # 查看状态

# Ollama
ollama serve             # 启动 Ollama 服务
ollama list              # 查看已下载模型
ollama pull <model>      # 下载模型
```

## 📚 相关文档

- [README.md](./README.md) - 项目概述
- [ARCHITECTURE.md](./ARCHITECTURE.md) - 架构详解
- [DEVELOPMENT.md](./DEVELOPMENT.md) - 开发指南
- [Supabase 文档](./supabase/README.md) - Supabase 配置

## 🆘 遇到问题？

1. **Rust 未安装**: 请先安装 Rust
2. **端口被占用**: 检查端口 54321, 11434, 5432 是否被占用
3. **依赖安装失败**: 尝试删除 `node_modules` 重新安装
4. **数据库连接失败**: 确保 Supabase 已启动

## 💡 提示

- 使用 `@project` 在 pi 中引用项目上下文
- 查看 `.pi/prompts/project.md` 了解项目架构细节
- 遵循扁平命名空间+标签的数据结构
- 业务逻辑在 React/PostgreSQL，不在 Rust

---

**祝您开发愉快！🎉**