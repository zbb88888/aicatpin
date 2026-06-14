# AICatPin 版本清单

## 前端依赖

| 包名 | 版本 | 说明 |
|------|------|------|
| react | ^18.3.1 | UI 框架 |
| react-dom | ^18.3.1 | React DOM |
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
| typescript | ^5.8.2 | TypeScript 编译器 |
| vite | ^6.2.2 | 构建工具 |
| @vitejs/plugin-react | ^4.3.4 | Vite React 插件 |
| tailwindcss | ^3.4.17 | CSS 框架 |
| postcss | ^8.5.3 | CSS 处理器 |
| autoprefixer | ^10.4.19 | 自动前缀 |
| tailwindcss-animate | ^1.0.7 | Tailwind 动画 |
| eslint | ^9.22.0 | 代码检查 |
| @typescript-eslint/eslint-plugin | ^8.26.1 | TypeScript ESLint |
| @typescript-eslint/parser | ^8.26.1 | TypeScript 解析器 |
| eslint-plugin-react-hooks | ^5.2.0 | React Hooks 规则 |
| eslint-plugin-react-refresh | ^0.4.19 | React Refresh 规则 |
| @tauri-apps/api | ^1.6.0 | Tauri API |
| @tauri-apps/cli | ^1.6.3 | Tauri CLI |
| @types/react | ^18.3.18 | React 类型 |
| @types/react-dom | ^18.3.5 | React DOM 类型 |

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
| node | 22-slim | Node.js 运行时 |

## 工具版本

| 工具 | 版本 | 说明 |
|------|------|------|
| Docker | 最新 | 容器化平台 |
| Docker Compose | 最新 | 容器编排 |
| Make | 最新 | 构建工具 |

## 更新日期

最后更新: 2024-01-02

## 更新日志

### 2024-01-02
- 更新所有前端依赖到最新稳定版本
- 更新 Node.js 到 22 (LTS)
- 更新 TypeScript 到 5.8.2
- 更新 Vite 到 6.2.2
- 更新 Tailwind CSS 到 3.4.17
- 更新 ESLint 到 9.22.0
- 统一 TipTap 版本到 2.27.2
- 更新 Tauri 配置到 v2 格式

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

1. **TipTap 版本**: 使用 2.27.2 版本，避免 3.x 的破坏性变更
2. **Tauri v2**: 配置格式有变化，需要更新 tauri.conf.json
3. **ESLint 9**: 使用 flat config 格式
4. **TypeScript 5.8**: 支持最新特性
5. **Vite 6**: 使用最新的构建优化