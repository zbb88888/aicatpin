# AICatPin 版本清单 (2026年6月)

## 前端依赖

| 包名 | 版本 | 说明 |
|------|------|------|
| react | ^19.1.0 | UI 框架 (最新稳定版) |
| react-dom | ^19.1.0 | React DOM |
| @tiptap/react | ^2.27.2 | 富文本编辑器 |
| @tiptap/starter-kit | ^2.27.2 | TipTap 基础套件 |
| @tiptap/extension-placeholder | ^2.27.2 | 占位符扩展 |
| @tiptap/extension-code-block-lowlight | ^2.27.2 | 代码高亮扩展 |
| @tiptap/extension-floating-menu | ^2.27.2 | 浮动菜单扩展 |
| @tiptap/suggestion | ^2.27.2 | 建议扩展 |
| @supabase/supabase-js | ^2.49.4 | Supabase 客户端 |
| @radix-ui/react-dialog | ^1.1.16 | 对话框组件 |
| @radix-ui/react-popover | ^1.1.16 | 弹出框组件 |
| @radix-ui/react-scroll-area | ^1.2.11 | 滚动区域组件 |
| @radix-ui/react-slot | ^1.2.5 | Slot 组件 |
| lucide-react | ^0.475.0 | 图标库 |
| tailwind-merge | ^3.0.2 | Tailwind 类名合并 |
| class-variance-authority | ^0.7.1 | 变体管理 |
| clsx | ^2.1.1 | 类名合并 |
| highlight.js | ^11.11.1 | 代码高亮 |
| lowlight | ^3.3.0 | 低光高亮 |
| tippy.js | ^6.3.7 | 提示框 |

## 开发依赖

| 包名 | 版本 | 说明 |
|------|------|------|
| typescript | ^5.8.3 | TypeScript 编译器 |
| vite | ^6.3.5 | 构建工具 |
| @vitejs/plugin-react | ^4.5.2 | Vite React 插件 |
| tailwindcss | ^4.1.7 | CSS 框架 (v4) |
| postcss | ^8.5.3 | CSS 处理器 |
| autoprefixer | ^10.4.21 | 自动前缀 |
| tailwindcss-animate | ^1.0.7 | Tailwind 动画 |
| eslint | ^9.28.0 | 代码检查 |
| @typescript-eslint/eslint-plugin | ^8.26.1 | TypeScript ESLint |
| @typescript-eslint/parser | ^8.26.1 | TypeScript 解析器 |
| eslint-plugin-react-hooks | ^5.2.0 | React Hooks 规则 |
| eslint-plugin-react-refresh | ^0.4.19 | React Refresh 规则 |
| @tauri-apps/api | ^2.3.0 | Tauri API |
| @tauri-apps/cli | ^2.5.0 | Tauri CLI |
| @types/react | ^19.1.0 | React 类型 |
| @types/react-dom | ^19.1.0 | React DOM 类型 |

## 后端依赖 (Rust)

| 包名 | 版本 | 说明 |
|------|------|------|
| tauri | 2 | 桌面应用框架 |
| tauri-build | 2 | Tauri 构建工具 |
| serde | 1 | 序列化框架 |
| serde_json | 1 | JSON 序列化 |
| serde_yaml | 0.9 | YAML 序列化 |
| chrono | 0.4 | 时间处理 |
| dirs | 6 | 目录处理 |
| slug | 0.1 | URL 友好 slug |
| reqwest | 0.12 | HTTP 客户端 |
| tokio | 1 | 异步运行时 |

## Docker 镜像

| 镜像 | 版本 | 说明 |
|------|------|------|
| node | 26-slim | Node.js 运行时 (最新稳定版) |

## 工具版本

| 工具 | 版本 | 说明 |
|------|------|------|
| Docker | 最新 | 容器化平台 |
| Docker Compose | 最新 | 容器编排 |
| Make | 最新 | 构建工具 |

## 更新日期

最后更新: 2026-06-14

## 更新日志

### 2026-06-14
- 更新 React 到 19.1.0
- 更新 Node.js 到 26 (最新稳定版)
- 更新 TypeScript 到 5.8.3
- 更新 Vite 到 6.3.5
- 更新 Tailwind CSS 到 4.1.7 (v4)
- 更新 ESLint 到 9.28.0
- 更新 Tauri API 到 2.3.0
- 更新 Tauri CLI 到 2.5.0
- 更新 Rust edition 到 2024
- 更新 tsconfig 使用 ES2024

## 版本检查命令

```bash
# 检查 npm 包版本
npm list --depth=0

# 检查过时的包
npm outdated

# 检查安全漏洞
npm audit

# 更新包
npm update
```

## 注意事项

1. **React 19**: 使用最新稳定版，支持 Server Components
2. **Tailwind CSS 4**: 使用新的配置格式
3. **Tauri 2**: 配置格式有变化
4. **TypeScript 5.8**: 支持最新特性
5. **Vite 6**: 使用最新的构建优化
6. **Node.js 26**: 最新稳定版
7. **Rust 2024**: 使用最新的 Rust edition