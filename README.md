# AICatPin

一个本地优先、AI原生的知识IDE，采用扁平的"类别（命名空间）+ 标签"架构。

## 特性

- 🏠 **本地优先** - 所有数据存储在本地 PostgreSQL 实例
- 🤖 **AI原生** - 集成本地 Ollama 进行内容摘要、嵌入和智能分类
- 📁 **扁平架构** - 摒弃传统多级文件夹，使用命名空间+标签系统
- ✨ **现代编辑器** - TipTap 块级编辑器，类 Notion 体验
- 🖥️ **桌面应用** - Tauri v2 提供原生桌面体验

## 技术栈

- **桌面框架:** Tauri v2 (Rust)
- **前端:** React 19 + Vite 8 + Tailwind CSS 4 + shadcn/ui
- **编辑器:** TipTap 3 (无头、块级)
- **数据库:** PostgreSQL 15+ (Supabase)
- **AI:** Ollama (本地运行)
- **语言:** TypeScript 6 + Node.js 24+

## 快速开始

### 前置要求
- Node.js 24+
- Rust 1.70+
- PostgreSQL 15+
- Ollama (运行在 http://localhost:11434)

### 安装
```bash
# 克隆项目
git clone <repository-url>
cd aicatpin

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 启动 Tauri 桌面应用
npm run tauri dev
```

## 架构

详细架构说明请查看 [ARCHITECTURE.md](./ARCHITECTURE.md)

### 核心数据流
```
前端 UI → Ollama (AI处理) → PostgreSQL (持久化)
```

### 项目结构
```
aicatpin/
├── src-tauri/          # Tauri Rust 后端 (系统级I/O)
├── src/                # React 前端 (业务逻辑)
├── supabase/           # 数据库配置和迁移
└── docs/               # 项目文档
```

## 开发原则

1. **永不构建传统文件树UI** - 使用扁平命名空间
2. **业务逻辑在 React/PostgreSQL** - Rust 仅用于系统级操作
3. **TypeScript 严格模式** - 类型安全
4. **函数式组件 + Hooks** - 现代 React 实践
5. **Tailwind CSS** - 最小化自定义 CSS

## 许可证

[待定]