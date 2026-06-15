# AICatPin 版本清单

## 最后更新
2026-06-15

## 运行时版本
| 组件 | 版本 | 说明 |
|------|------|------|
| Node.js | 24.16.0 | 最新 LTS |
| npm | 11.13.0 | 随 Node.js 24 附带 |

## 前端依赖

### 核心框架
| 包名 | 版本 | 用途 |
|------|------|------|
| react | 19.2.7 | UI 框架 |
| react-dom | 19.2.7 | React DOM 渲染 |
| typescript | 6.0.3 | 类型系统 |

### 构建工具
| 包名 | 版本 | 用途 |
|------|------|------|
| vite | 8.0.16 | 构建工具 |
| @vitejs/plugin-react | 6.0.2 | React 插件 |
| postcss | 8.5.15 | CSS 处理 |
| autoprefixer | 10.5.0 | CSS 前缀 |

### UI 框架
| 包名 | 版本 | 用途 |
|------|------|------|
| tailwindcss | 4.3.1 | CSS 框架 |
| @tailwindcss/postcss | 4.3.1 | Tailwind PostCSS 插件 |
| tailwind-merge | 3.6.0 | Tailwind 类名合并 |
| tailwindcss-animate | 1.0.7 | 动画插件 |
| class-variance-authority | 0.7.1 | 类名变体 |
| clsx | 2.1.1 | 类名工具 |

### 编辑器
| 包名 | 版本 | 用途 |
|------|------|------|
| @tiptap/react | 3.26.1 | TipTap React 集成 |
| @tiptap/starter-kit | 3.26.1 | TipTap 基础扩展包 |
| @tiptap/extension-placeholder | 3.26.1 | 占位符扩展 |
| @tiptap/extension-code-block-lowlight | 3.26.1 | 代码块高亮 |
| @tiptap/extension-floating-menu | 3.26.1 | 浮动菜单 |
| @tiptap/suggestion | 3.26.1 | 建议扩展 |
| tiptap-markdown | 0.9.0 | Markdown 支持 |
| markdown-it | 14.2.0 | Markdown 解析器 |
| @types/markdown-it | 14.1.2 | Markdown 类型定义 |

### UI 组件
| 包名 | 版本 | 用途 |
|------|------|------|
| @radix-ui/react-dialog | 1.1.16 | 对话框组件 |
| @radix-ui/react-popover | 1.1.16 | 弹出框组件 |
| @radix-ui/react-scroll-area | 1.2.11 | 滚动区域组件 |
| @radix-ui/react-slot | 1.2.5 | 插槽组件 |
| lucide-react | 1.18.0 | 图标库 |

### 数据库
| 包名 | 版本 | 用途 |
|------|------|------|
| @supabase/supabase-js | 2.108.1 | Supabase 客户端 |

### 桌面应用
| 包名 | 版本 | 用途 |
|------|------|------|
| @tauri-apps/api | 2.11.0 | Tauri API |
| @tauri-apps/cli | 2.11.2 | Tauri CLI |

### 代码高亮
| 包名 | 版本 | 用途 |
|------|------|------|
| highlight.js | 11.11.1 | 代码高亮库 |
| lowlight | 3.3.0 | Lowlight 集成 |

### 其他
| 包名 | 版本 | 用途 |
|------|------|------|
| tippy.js | 6.3.7 | 提示框库 |

## 开发依赖

### 代码质量
| 包名 | 版本 | 用途 |
|------|------|------|
| eslint | 10.5.0 | 代码检查 |
| @eslint/js | 10.0.1 | ESLint 核心 |
| @typescript-eslint/eslint-plugin | 8.61.0 | TypeScript ESLint 插件 |
| @typescript-eslint/parser | 8.61.0 | TypeScript 解析器 |
| eslint-plugin-react-hooks | 7.1.1 | React Hooks 规则 |
| eslint-plugin-react-refresh | 0.5.3 | React Refresh 规则 |
| globals | 17.6.0 | 全局变量定义 |
| typescript-eslint | 8.61.0 | TypeScript ESLint 集成 |

### 类型定义
| 包名 | 版本 | 用途 |
|------|------|------|
| @types/react | 19.2.17 | React 类型定义 |
| @types/react-dom | 19.2.3 | React DOM 类型定义 |

## Docker 镜像
| 镜像 | 版本 | 用途 |
|------|------|------|
| node | 24-slim | Node.js 运行时 |

## 服务依赖
| 服务 | 版本 | 用途 |
|------|------|------|
| Supabase | 最新 | 数据库和 API |
| Ollama | 最新 | AI 服务 |
| PostgreSQL | 15+ | 数据库 |

## 验证状态
- ✅ TypeScript 编译通过
- ✅ ESLint 检查通过
- ✅ 生产构建成功
- ✅ 所有依赖为最新稳定版

---

**注意**: 所有版本均为 2026-06-15 查询的最新稳定版本。