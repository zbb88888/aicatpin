#!/bin/bash

# AICatPin 项目初始化脚本
echo "🚀 开始初始化 AICatPin 项目..."

# 创建目录结构
echo "📁 创建目录结构..."
mkdir -p src/{components,hooks,lib,types,styles}
mkdir -p src/components/{ui,editor,notes,tags,namespaces}
mkdir -p src-tauri/src
mkdir -p supabase/{migrations,seed}
mkdir -p public
mkdir -p docs

# 创建基础文件
echo "📄 创建基础文件..."

# package.json
cat > package.json << 'EOF'
{
  "name": "aicatpin",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "tauri": "tauri",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.39.0",
    "@tiptap/react": "^2.1.13",
    "@tiptap/starter-kit": "^2.1.13",
    "@tiptap/extension-placeholder": "^2.1.13",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0",
    "lucide-react": "^0.294.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "tailwind-merge": "^2.1.0"
  },
  "devDependencies": {
    "@tauri-apps/api": "^1.5.3",
    "@tauri-apps/cli": "^1.5.9",
    "@types/react": "^18.2.43",
    "@types/react-dom": "^18.2.17",
    "@typescript-eslint/eslint-plugin": "^6.14.0",
    "@typescript-eslint/parser": "^6.14.0",
    "@vitejs/plugin-react": "^4.2.1",
    "autoprefixer": "^10.4.16",
    "eslint": "^8.55.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.5",
    "postcss": "^8.4.32",
    "tailwindcss": "^3.3.6",
    "typescript": "^5.2.2",
    "vite": "^5.0.8"
  }
}
EOF

# tsconfig.json
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
EOF

# vite.config.ts
cat > vite.config.ts << 'EOF'
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(async () => ({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    host: true,
  },
}));
EOF

# tailwind.config.js
cat > tailwind.config.js << 'EOF'
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
EOF

# postcss.config.js
cat > postcss.config.js << 'EOF'
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
EOF

# index.html
cat > index.html << 'EOF'
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>AICatPin - AI原生知识IDE</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
EOF

# 创建基本的源文件
echo "📝 创建基本源文件..."

# main.tsx
cat > src/main.tsx << 'EOF'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/globals.css'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
EOF

# App.tsx
cat > src/App.tsx << 'EOF'
import { useState } from 'react'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="p-4 border-b">
        <h1 className="text-2xl font-bold">AICatPin</h1>
        <p className="text-muted-foreground">AI原生知识IDE</p>
      </header>
      
      <main className="container mx-auto p-4">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <h2 className="text-4xl font-bold mb-4">欢迎使用 AICatPin</h2>
          <p className="text-lg text-muted-foreground mb-8">
            本地优先、AI原生的知识管理工具
          </p>
          
          <button
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            onClick={() => setCount((count) => count + 1)}
          >
            计数: {count}
          </button>
          
          <div className="mt-8 p-4 bg-muted rounded-lg">
            <p>技术栈: React + Tauri + Supabase + Ollama</p>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
EOF

# globals.css
cat > src/styles/globals.css << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
    --radius: 0.5rem;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
EOF

# Supabase 配置
cat > src/lib/supabase.ts << 'EOF'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'http://localhost:54321'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
EOF

# 环境变量模板
cat > .env.example << 'EOF'
# Supabase 配置
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=your-anon-key

# Ollama 配置
VITE_OLLAMA_URL=http://localhost:11434
EOF

# 创建 .env 文件
cp .env.example .env

# 类型定义
cat > src/types/index.ts << 'EOF'
export interface Namespace {
  id: string
  name: string
  description?: string
  created_at: string
  updated_at: string
}

export interface Note {
  id: string
  title: string
  content?: string
  namespace_id: string
  tags: string[]
  summary?: string
  created_at: string
  updated_at: string
}

export interface Tag {
  id: string
  name: string
  color: string
  created_at: string
}
EOF

# Tauri 配置
echo "🦀 配置 Tauri..."
mkdir -p src-tauri/src

# Cargo.toml
cat > src-tauri/Cargo.toml << 'EOF'
[package]
name = "aicatpin"
version = "0.1.0"
description = "AICatPin - AI原生知识IDE"
authors = ["you"]
edition = "2021"

[build-dependencies]
tauri-build = { version = "1.5", features = [] }

[dependencies]
tauri = { version = "1.5", features = ["shell-open"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
EOF

# build.rs
cat > src-tauri/build.rs << 'EOF'
fn main() {
    tauri_build::build()
}
EOF

# tauri.conf.json
cat > src-tauri/tauri.conf.json << 'EOF'
{
  "build": {
    "beforeDevCommand": "npm run dev",
    "devUrl": "http://localhost:1420",
    "beforeBuildCommand": "npm run build",
    "frontendDist": "../dist"
  },
  "package": {
    "productName": "AICatPin",
    "version": "0.1.0"
  },
  "tauri": {
    "allowlist": {
      "all": false,
      "shell": {
        "all": false,
        "open": true
      }
    },
    "bundle": {
      "active": true,
      "targets": "all",
      "identifier": "com.aicatpin.app",
      "icon": [
        "icons/32x32.png",
        "icons/128x128.png",
        "icons/128x128@2x.png",
        "icons/icon.icns",
        "icons/icon.ico"
      ]
    },
    "security": {
      "csp": null
    },
    "windows": [
      {
        "fullscreen": false,
        "resizable": true,
        "title": "AICatPin",
        "width": 1200,
        "height": 800
      }
    ]
  }
}
EOF

# main.rs
cat > src-tauri/src/main.rs << 'EOF'
// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
EOF

# Git 配置
cat > .gitignore << 'EOF'
# Dependencies
node_modules
.pnp
.pnp.js

# Testing
coverage

# Production
build
dist

# Misc
.DS_Store
.env.local
.env.development.local
.env.test.local
.env.production.local

npm-debug.log*
yarn-debug.log*
yarn-error.log*

# IDE
.vscode
.idea
*.swp
*.swo

# Tauri
src-tauri/target

# Supabase
supabase/.temp
EOF

echo ""
echo "✅ AICatPin 项目初始化完成！"
echo ""
echo "📋 下一步："
echo "1. 安装依赖: npm install"
echo "2. 配置环境变量: 编辑 .env 文件"
echo "3. 启动 Supabase: supabase start"
echo "4. 启动 Ollama: ollama serve"
echo "5. 开始开发: npm run tauri dev"
echo ""
echo "📖 文档："
echo "- README.md - 项目概述"
echo "- ARCHITECTURE.md - 架构文档"
echo "- DEVELOPMENT.md - 开发指南"
echo ""
echo "🎯 提示词已配置在 .pi/prompts/project.md"
echo "   使用 @project 来引用项目上下文"