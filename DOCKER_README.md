# AICatPin Docker 部署指南

## 概述

AICatPin 现在完全基于 Docker 技术栈，所有构建、测试、运行命令都使用 Docker 实现。

## 快速开始

### 1. 检查环境

```bash
# 检查 Docker 环境
make check-env

# 检查端口
make check-ports
```

### 2. 启动开发环境

```bash
# 创建环境配置
make env

# 启动开发环境
make dev
```

### 3. 访问服务

- **前端**: http://localhost:1420
- **Supabase**: http://localhost:54321
- **Ollama**: http://localhost:11434
- **Studio**: http://localhost:3000 (需要启动 studio profile)

## 常用命令

### 开发环境

```bash
make dev          # 启动开发环境
make dev-logs     # 查看开发环境日志
make dev-stop     # 停止开发环境
make dev-restart  # 重启开发环境
```

### 生产环境

```bash
make prod         # 启动生产环境
make prod-logs    # 查看生产环境日志
make prod-stop    # 停止生产环境
```

### 数据库操作

```bash
make db           # 启动数据库服务
make db-logs      # 查看数据库日志
make db-stop      # 停止数据库服务
make db-reset     # 重置数据库
make db-shell     # 进入数据库 Shell
make db-studio    # 启动 Supabase Studio
```

### Ollama 操作

```bash
make ollama       # 启动 Ollama 服务
make ollama-logs  # 查看 Ollama 日志
make ollama-stop  # 停止 Ollama 服务
make ollama-pull  # 下载 Ollama 模型
make ollama-shell # 进入 Ollama Shell
make ollama-status # 查看 Ollama 状态
make ollama-test  # 测试 Ollama API
```

### 构建

```bash
make build        # 构建 Docker 镜像
make build-frontend # 构建前端镜像
make build-no-cache # 无缓存构建
```

### 测试

```bash
make test         # 运行测试
make test-frontend # 运行前端测试
make test-backend # 运行后端测试
make test-db      # 运行数据库测试
make test-watch   # 运行测试（监听模式）
```

### 代码质量

```bash
make lint         # 运行代码检查
make lint-fix     # 自动修复代码问题
make format       # 格式化代码
make typecheck    # 运行类型检查
```

### 清理

```bash
make clean        # 清理所有容器和镜像
make clean-containers # 清理容器
make clean-volumes # 清理数据卷
make clean-images # 清理镜像
make clean-all    # 清理所有（包括未使用的镜像）
```

### 重建

```bash
make rebuild      # 重新构建（清理+构建）
make rebuild-frontend # 重新构建前端
make reset        # 完全重置（清理+构建）
make reset-all    # 完全重置（包括所有数据）
```

### 服务管理

```bash
make start        # 启动所有服务
make stop         # 停止所有服务
make restart      # 重启所有服务
make status       # 查看服务状态
make logs         # 查看所有服务日志
make ps           # 查看容器状态
```

### 进入容器

```bash
make shell        # 进入前端容器 Shell
make db-shell     # 进入数据库 Shell
make ollama-shell # 进入 Ollama Shell
```

## 环境变量

### 创建环境配置

```bash
make env
```

### 编辑环境配置

```bash
make env-edit
```

### 环境变量说明

```env
# PostgreSQL 配置
POSTGRES_PASSWORD=postgres
POSTGRES_DB=postgres
POSTGRES_USER=postgres

# Supabase 配置
SUPABASE_ANON_KEY=your-anon-key

# Ollama 配置
OLLAMA_MODEL=gemma4:e2b
OLLAMA_EMBEDDING_MODEL=nomic-embed-text
```

## 服务架构

```
┌─────────────────────────────────────────────────────────────┐
│                    AICatPin Docker 架构                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Frontend   │  │  Supabase   │  │   Ollama    │         │
│  │  (Node.js)   │  │ (PostgreSQL)│  │   (AI)      │         │
│  │   :1420      │  │   :5432     │  │   :11434    │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│         │                │                │                 │
│         └────────────────┼────────────────┘                 │
│                          │                                  │
│                    ┌─────┴─────┐                           │
│                    │  Network  │                           │
│                    └───────────┘                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 故障排除

### 1. 端口被占用

```bash
# 检查端口使用情况
make check-ports

# 停止占用端口的服务
make stop
```

### 2. Docker 服务未运行

```bash
# 启动 Docker 服务
sudo systemctl start docker

# 检查 Docker 状态
make check-env
```

### 3. 容器启动失败

```bash
# 查看容器日志
make logs

# 查看特定服务日志
make dev-logs
make db-logs
make ollama-logs
```

### 4. 数据库连接失败

```bash
# 重置数据库
make db-reset

# 进入数据库 Shell
make db-shell
```

### 5. Ollama 服务不可用

```bash
# 重启 Ollama 服务
make ollama-stop
make ollama

# 下载模型
make ollama-pull
```

## 最佳实践

1. **定期清理**: 使用 `make clean` 清理未使用的资源
2. **查看日志**: 使用 `make logs` 查看服务状态
3. **备份数据**: 定期备份数据卷
4. **更新镜像**: 使用 `make build-no-cache` 更新镜像
5. **环境隔离**: 使用不同的环境配置文件

## 相关文档

- [README.md](./README.md) - 项目概述
- [ARCHITECTURE.md](./ARCHITECTURE.md) - 架构文档
- [DEVELOPMENT.md](./DEVELOPMENT.md) - 开发指南
- [Makefile.md](./Makefile.md) - Make 命令指南

---

**最后更新**: 2024-01-02  
**维护者**: AICatPin Team