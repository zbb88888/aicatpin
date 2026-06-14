# AICatPin Makefile 使用指南

## 概述

本 Makefile 维护了 AICatPin 项目的所有构建、测试、清理和重建流程。

## 快速开始

```bash
# 查看所有可用命令
make help

# 检查开发环境
make check-env

# 启动开发服务器
make dev

# 构建生产版本
make build

# 运行测试
make test

# 清理构建文件
make clean
```

## 命令分类

### 🔧 环境检查

```bash
make check-env      # 检查开发环境
make check-deps     # 检查依赖是否安装
make check-ports    # 检查端口是否可用
```

### 📦 安装依赖

```bash
make install        # 安装所有依赖
make install-frontend  # 安装前端依赖
make install-backend   # 安装后端依赖
make install-all    # 安装所有依赖（前端+后端）
```

### 🚀 开发服务器

```bash
make dev            # 启动前端开发服务器
make dev-tauri      # 启动 Tauri 桌面应用（开发模式）
make dev-all        # 启动所有开发服务
```

### 🏗️ 构建

```bash
make build          # 构建生产版本（前端+后端）
make build-frontend # 构建前端
make build-backend  # 构建后端（Tauri）
make build-tauri    # 构建 Tauri 桌面应用
make build-release  # 构建发布版本
```

### 🔍 代码质量

```bash
make typecheck      # 运行 TypeScript 类型检查
make lint           # 运行代码检查
make lint-fix       # 自动修复代码问题
make format         # 格式化代码
make check          # 运行所有检查（类型检查+代码检查）
```

### 🧪 测试

```bash
make test           # 运行所有测试
make test-frontend  # 运行前端测试
make test-backend   # 运行后端测试
make test-watch     # 运行测试（监听模式）
make test-db        # 运行数据库测试
```

### 🗄️ 数据库操作

```bash
make db-start       # 启动 Supabase 数据库
make db-stop        # 停止 Supabase 数据库
make db-reset       # 重置数据库
make db-migrate     # 运行数据库迁移
make db-types       # 生成 TypeScript 类型
make db-status      # 查看数据库状态
make db-studio      # 打开 Supabase Studio
```

### 🤖 Ollama 操作

```bash
make ollama-start   # 启动 Ollama 服务
make ollama-pull    # 下载所需模型
make ollama-status  # 查看 Ollama 状态
make ollama-test    # 测试 Ollama API
```

### 🧹 清理

```bash
make clean          # 清理所有构建文件
make clean-frontend # 清理前端构建文件
make clean-backend  # 清理后端构建文件
make clean-deps     # 清理依赖
make clean-cache    # 清理缓存
make clean-db       # 清理数据库
make clean-vault    # 清理本地 Vault
```

### 🔄 重建

```bash
make rebuild        # 重新构建（清理+安装+构建）
make rebuild-frontend  # 重新构建前端
make rebuild-backend   # 重新构建后端
make rebuild-tauri  # 重新构建 Tauri 应用
make reset          # 完全重置（清理+清理依赖+安装+构建）
make reset-all      # 完全重置（包括数据库和 Vault）
```

### 🧪 测试环境

```bash
make test-env-setup # 设置测试环境
make test-env-clean # 清理测试环境
make test-env-reset # 重置测试环境
```

### 📝 代码生成

```bash
# 生成新组件
make gen-component name=MyComponent

# 生成新 Hook
make gen-hook name=useMyHook
```

### 📚 文档

```bash
make docs           # 生成文档
make docs-serve     # 启动文档服务器
```

### 🚀 部署

```bash
make deploy         # 部署应用
make deploy-frontend  # 部署前端
```

### 📊 监控和日志

```bash
make logs           # 查看日志
make status         # 查看项目状态
```

### 🔧 Git 操作

```bash
make git-status     # 查看 Git 状态
make git-commit message="提交信息"  # 提交更改
make git-push       # 推送到远程仓库
```

### ⚡ 快捷命令

```bash
make start          # 启动所有服务（数据库+Ollama+开发服务器）
make stop           # 停止所有服务
make restart        # 重启所有服务
make update         # 更新依赖并构建
make upgrade        # 升级依赖
```

### 🛠️ 开发工具

```bash
make studio         # 打开数据库管理界面
make editor         # 打开编辑器演示
make api            # 测试 API
```

### 🔒 维护命令

```bash
make audit          # 安全审计
make audit-fix      # 修复安全问题
make outdated       # 检查过时的依赖
```

### 🐛 调试命令

```bash
make debug          # 启动调试模式
make debug-tauri    # 启动 Tauri 调试模式
make trace          # 启动跟踪模式
```

### 📈 性能分析

```bash
make profile        # 运行性能分析
make benchmark      # 运行基准测试
```

### 💾 备份和恢复

```bash
make backup         # 备份数据
make restore file=backups/vault-20240101_120000.tar.gz  # 恢复数据
```

### 🔧 环境变量

```bash
make env            # 显示环境变量
make env-example    # 生成环境变量示例
```

### 📊 依赖分析

```bash
make deps           # 分析依赖
make deps-graph     # 生成依赖图
```

### 📈 代码统计

```bash
make stats          # 代码统计
```

### ℹ️ 信息显示

```bash
make version        # 显示版本信息
make info           # 显示项目信息
```

## 常用工作流程

### 1. 首次设置

```bash
# 检查环境
make check-env

# 安装依赖
make install

# 启动数据库
make db-start

# 启动 Ollama
make ollama-start

# 下载模型
make ollama-pull

# 启动开发服务器
make dev
```

### 2. 日常开发

```bash
# 启动所有服务
make start

# 运行代码检查
make check

# 运行测试
make test

# 提交更改
make git-commit message="添加新功能"
```

### 3. 构建发布

```bash
# 清理旧构建
make clean

# 构建生产版本
make build

# 运行测试
make test

# 构建 Tauri 应用
make build-tauri
```

### 4. 问题排查

```bash
# 查看项目状态
make status

# 检查依赖
make check-deps

# 检查端口
make check-ports

# 查看日志
make logs
```

### 5. 完全重置

```bash
# 清理所有内容
make reset-all

# 重新安装
make install

# 重新构建
make build
```

## 自定义配置

### 环境变量

在 `.env` 文件中配置：

```env
# Supabase 配置
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=your-anon-key

# Ollama 配置
VITE_OLLAMA_URL=http://localhost:11434
```

### 端口配置

在 Makefile 中修改端口配置：

```makefile
VITE_PORT     := 1420
SUPABASE_PORT := 54321
OLLAMA_PORT   := 11434
POSTGRES_PORT := 5432
```

## 故障排除

### 1. 端口被占用

```bash
# 检查端口使用情况
make check-ports

# 停止占用端口的服务
make stop
```

### 2. 依赖问题

```bash
# 清理依赖
make clean-deps

# 重新安装
make install
```

### 3. 构建失败

```bash
# 清理构建文件
make clean

# 重新构建
make rebuild
```

### 4. 数据库问题

```bash
# 重置数据库
make db-reset

# 重新运行迁移
make db-migrate
```

## 最佳实践

1. **定期清理**: 使用 `make clean` 清理构建文件
2. **代码检查**: 提交前运行 `make check`
3. **测试优先**: 修改代码后运行 `make test`
4. **环境隔离**: 使用 `make test-env-setup` 设置测试环境
5. **备份数据**: 定期运行 `make backup`

## 相关文档

- [README.md](./README.md) - 项目概述
- [ARCHITECTURE.md](./ARCHITECTURE.md) - 架构文档
- [DEVELOPMENT.md](./DEVELOPMENT.md) - 开发指南
- [QUICKSTART.md](./QUICKSTART.md) - 快速开始

---

**最后更新**: 2024-01-02  
**维护者**: AICatPin Team