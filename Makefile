# ============================================================
# AICatPin Docker Makefile
# 基于 Docker 的构建、测试、运行流程
# ============================================================

# 默认 shell
SHELL := /bin/bash

# 颜色输出
GREEN  := \033[0;32m
YELLOW := \033[0;33m
RED    := \033[0;31m
BLUE   := \033[0;34m
CYAN   := \033[0;36m
NC     := \033[0m # No Color

# Docker 配置
DOCKER_COMPOSE := docker compose
DOCKER := docker

# 项目配置
PROJECT_NAME := aicatpin
FRONTEND_PORT := 1420
SUPABASE_PORT := 54321
POSTGRES_PORT := 5432
OLLAMA_PORT := 11434
STUDIO_PORT := 3000

# ============================================================
# 默认目标
# ============================================================

.PHONY: all
all: help

# ============================================================
# 帮助信息
# ============================================================

.PHONY: help
help: ## 显示帮助信息
	@echo "$(CYAN)╔════════════════════════════════════════════════════════════╗$(NC)"
	@echo "$(CYAN)║              AICatPin Docker 构建系统                     ║$(NC)"
	@echo "$(CYAN)╚════════════════════════════════════════════════════════════╝$(NC)"
	@echo ""
	@echo "$(GREEN)可用命令:$(NC)"
	@echo ""
	@awk 'BEGIN {FS = ":.*##"} /^[a-zA-Z_-]+:.*##/ {printf "  $(CYAN)%-20s$(NC) %s\n", $$1, $$2}' $(MAKEFILE_LIST)
	@echo ""
	@echo "$(YELLOW)示例:$(NC)"
	@echo "  make dev          # 启动开发环境"
	@echo "  make build        # 构建生产镜像"
	@echo "  make test         # 运行测试"
	@echo "  make clean        # 清理所有容器和镜像"
	@echo ""

# ============================================================
# 环境检查
# ============================================================

.PHONY: check-env
check-env: ## 检查 Docker 环境
	@echo "$(BLUE)检查 Docker 环境...$(NC)"
	@command -v docker >/dev/null 2>&1 || { echo "$(RED)错误: docker 未安装$(NC)"; exit 1; }
	@command -v docker compose >/dev/null 2>&1 || { echo "$(RED)错误: docker compose 未安装$(NC)"; exit 1; }
	@docker info >/dev/null 2>&1 || { echo "$(RED)错误: Docker 服务未运行$(NC)"; exit 1; }
	@echo "$(GREEN)✓ Docker 环境检查通过$(NC)"

.PHONY: check-ports
check-ports: ## 检查端口是否可用
	@echo "$(BLUE)检查端口...$(NC)"
	@for port in $(FRONTEND_PORT) $(SUPABASE_PORT) $(POSTGRES_PORT) $(OLLAMA_PORT); do \
		if lsof -Pi :$$port -sTCP:LISTEN -t >/dev/null 2>&1; then \
			echo "$(YELLOW)⚠ 端口 $$port 已被占用$(NC)"; \
		else \
			echo "$(GREEN)✓ 端口 $$port 可用$(NC)"; \
		fi; \
	done

# ============================================================
# 环境配置
# ============================================================

.PHONY: env
env: ## 创建环境配置文件
	@echo "$(BLUE)创建环境配置文件...$(NC)"
	@if [ ! -f .env ]; then \
		cp .env.docker .env; \
		echo "$(GREEN)✓ 环境配置文件已创建$(NC)"; \
	else \
		echo "$(YELLOW)提示: .env 文件已存在$(NC)"; \
	fi

.PHONY: env-edit
env-edit: ## 编辑环境配置文件
	@echo "$(BLUE)编辑环境配置文件...$(NC)"
	@nano .env

# ============================================================
# 开发环境
# ============================================================

.PHONY: dev
dev: env ## 启动开发环境
	@echo "$(BLUE)启动开发环境...$(NC)"
	$(DOCKER_COMPOSE) up -d aicatpin
	@echo "$(GREEN)✓ 开发环境已启动$(NC)"
	@echo ""
	@echo "$(GREEN)访问地址:$(NC)"
	@echo "  前端: http://localhost:$(FRONTEND_PORT)"
	@echo "  Supabase: http://localhost:$(SUPABASE_PORT)"
	@echo "  Ollama: http://localhost:$(OLLAMA_PORT)"

.PHONY: dev-logs
dev-logs: ## 查看开发环境日志
	@echo "$(BLUE)查看开发环境日志...$(NC)"
	$(DOCKER_COMPOSE) logs -f aicatpin

.PHONY: dev-stop
dev-stop: ## 停止开发环境
	@echo "$(BLUE)停止开发环境...$(NC)"
	$(DOCKER_COMPOSE) stop aicatpin
	@echo "$(GREEN)✓ 开发环境已停止$(NC)"

.PHONY: dev-restart
dev-restart: ## 重启开发环境
	@echo "$(BLUE)重启开发环境...$(NC)"
	$(DOCKER_COMPOSE) restart aicatpin
	@echo "$(GREEN)✓ 开发环境已重启$(NC)"

# ============================================================
# 生产环境
# ============================================================

.PHONY: prod
prod: env ## 启动生产环境
	@echo "$(BLUE)启动生产环境...$(NC)"
	$(DOCKER_COMPOSE) --profile production up -d
	@echo "$(GREEN)✓ 生产环境已启动$(NC)"

.PHONY: prod-logs
prod-logs: ## 查看生产环境日志
	@echo "$(BLUE)查看生产环境日志...$(NC)"
	$(DOCKER_COMPOSE) --profile production logs -f

.PHONY: prod-stop
prod-stop: ## 停止生产环境
	@echo "$(BLUE)停止生产环境...$(NC)"
	$(DOCKER_COMPOSE) --profile production down
	@echo "$(GREEN)✓ 生产环境已停止$(NC)"

# ============================================================
# 数据库操作
# ============================================================

.PHONY: db
db: ## 启动数据库服务
	@echo "$(BLUE)启动数据库服务...$(NC)"
	$(DOCKER_COMPOSE) up -d supabase
	@echo "$(GREEN)✓ 数据库服务已启动$(NC)"

.PHONY: db-logs
db-logs: ## 查看数据库日志
	@echo "$(BLUE)查看数据库日志...$(NC)"
	$(DOCKER_COMPOSE) logs -f supabase

.PHONY: db-stop
db-stop: ## 停止数据库服务
	@echo "$(BLUE)停止数据库服务...$(NC)"
	$(DOCKER_COMPOSE) stop supabase
	@echo "$(GREEN)✓ 数据库服务已停止$(NC)"

.PHONY: db-reset
db-reset: ## 重置数据库
	@echo "$(BLUE)重置数据库...$(NC)"
	$(DOCKER_COMPOSE) down -v supabase
	$(DOCKER_COMPOSE) up -d supabase
	@echo "$(GREEN)✓ 数据库已重置$(NC)"

.PHONY: db-studio
db-studio: ## 启动 Supabase Studio
	@echo "$(BLUE)启动 Supabase Studio...$(NC)"
	$(DOCKER_COMPOSE) --profile studio up -d studio
	@echo "$(GREEN)✓ Supabase Studio 已启动$(NC)"
	@echo "$(GREEN)访问地址: http://localhost:$(STUDIO_PORT)$(NC)"

# ============================================================
# Ollama 操作
# ============================================================

.PHONY: ollama
ollama: ## 启动 Ollama 服务
	@echo "$(BLUE)启动 Ollama 服务...$(NC)"
	$(DOCKER_COMPOSE) up -d ollama
	@echo "$(GREEN)✓ Ollama 服务已启动$(NC)"

.PHONY: ollama-logs
ollama-logs: ## 查看 Ollama 日志
	@echo "$(BLUE)查看 Ollama 日志...$(NC)"
	$(DOCKER_COMPOSE) logs -f ollama

.PHONY: ollama-stop
ollama-stop: ## 停止 Ollama 服务
	@echo "$(BLUE)停止 Ollama 服务...$(NC)"
	$(DOCKER_COMPOSE) stop ollama
	@echo "$(GREEN)✓ Ollama 服务已停止$(NC)"

.PHONY: ollama-pull
ollama-pull: ## 下载 Ollama 模型
	@echo "$(BLUE)下载 Ollama 模型...$(NC)"
	$(DOCKER_COMPOSE) exec ollama ollama pull gemma4:e2b
	$(DOCKER_COMPOSE) exec ollama ollama pull nomic-embed-text
	@echo "$(GREEN)✓ 模型下载完成$(NC)"

.PHONY: ollama-status
ollama-status: ## 查看 Ollama 状态
	@echo "$(BLUE)查看 Ollama 状态...$(NC)"
	$(DOCKER_COMPOSE) exec ollama ollama list

.PHONY: ollama-test
ollama-test: ## 测试 Ollama API
	@echo "$(BLUE)测试 Ollama API...$(NC)"
	@curl -s http://localhost:$(OLLAMA_PORT)/api/tags | jq '.'

# ============================================================
# 构建
# ============================================================

.PHONY: build
build: ## 构建 Docker 镜像
	@echo "$(BLUE)构建 Docker 镜像...$(NC)"
	$(DOCKER_COMPOSE) build
	@echo "$(GREEN)✓ Docker 镜像构建完成$(NC)"

.PHONY: build-frontend
build-frontend: ## 构建前端镜像
	@echo "$(BLUE)构建前端镜像...$(NC)"
	$(DOCKER_COMPOSE) build aicatpin
	@echo "$(GREEN)✓ 前端镜像构建完成$(NC)"

.PHONY: build-no-cache
build-no-cache: ## 无缓存构建
	@echo "$(BLUE)无缓存构建...$(NC)"
	$(DOCKER_COMPOSE) build --no-cache
	@echo "$(GREEN)✓ 无缓存构建完成$(NC)"

# ============================================================
# 测试
# ============================================================

.PHONY: test
test: ## 运行测试
	@echo "$(BLUE)运行测试...$(NC)"
	$(DOCKER_COMPOSE) exec aicatpin npm test
	@echo "$(GREEN)✓ 测试完成$(NC)"

.PHONY: test-frontend
test-frontend: ## 运行前端测试
	@echo "$(BLUE)运行前端测试...$(NC)"
	$(DOCKER_COMPOSE) exec aicatpin npm run test:frontend
	@echo "$(GREEN)✓ 前端测试完成$(NC)"

.PHONY: test-backend
test-backend: ## 运行后端测试
	@echo "$(BLUE)运行后端测试...$(NC)"
	$(DOCKER_COMPOSE) exec aicatpin npm run test:backend
	@echo "$(GREEN)✓ 后端测试完成$(NC)"

.PHONY: test-db
test-db: ## 运行数据库测试
	@echo "$(BLUE)运行数据库测试...$(NC)"
	$(DOCKER_COMPOSE) exec supabase psql -U postgres -f /docker-entrypoint-initdb.d/test.sql
	@echo "$(GREEN)✓ 数据库测试完成$(NC)"

.PHONY: test-watch
test-watch: ## 运行测试（监听模式）
	@echo "$(BLUE)运行测试（监听模式）...$(NC)"
	$(DOCKER_COMPOSE) exec aicatpin npm run test:watch

# ============================================================
# 代码质量
# ============================================================

.PHONY: lint
lint: ## 运行代码检查
	@echo "$(BLUE)运行代码检查...$(NC)"
	$(DOCKER_COMPOSE) exec aicatpin npm run lint
	@echo "$(GREEN)✓ 代码检查完成$(NC)"

.PHONY: lint-fix
lint-fix: ## 自动修复代码问题
	@echo "$(BLUE)自动修复代码问题...$(NC)"
	$(DOCKER_COMPOSE) exec aicatpin npm run lint:fix
	@echo "$(GREEN)✓ 代码问题已修复$(NC)"

.PHONY: format
format: ## 格式化代码
	@echo "$(BLUE)格式化代码...$(NC)"
	$(DOCKER_COMPOSE) exec aicatpin npm run format
	@echo "$(GREEN)✓ 代码格式化完成$(NC)"

.PHONY: typecheck
typecheck: ## 运行类型检查
	@echo "$(BLUE)运行类型检查...$(NC)"
	$(DOCKER_COMPOSE) exec aicatpin npx tsc --noEmit
	@echo "$(GREEN)✓ 类型检查完成$(NC)"

# ============================================================
# 清理
# ============================================================

.PHONY: clean
clean: ## 清理所有容器和镜像
	@echo "$(BLUE)清理所有容器和镜像...$(NC)"
	$(DOCKER_COMPOSE) down -v --rmi all
	@echo "$(GREEN)✓ 清理完成$(NC)"

.PHONY: clean-containers
clean-containers: ## 清理容器
	@echo "$(BLUE)清理容器...$(NC)"
	$(DOCKER_COMPOSE) down
	@echo "$(GREEN)✓ 容器清理完成$(NC)"

.PHONY: clean-volumes
clean-volumes: ## 清理数据卷
	@echo "$(BLUE)清理数据卷...$(NC)"
	$(DOCKER_COMPOSE) down -v
	@echo "$(GREEN)✓ 数据卷清理完成$(NC)"

.PHONY: clean-images
clean-images: ## 清理镜像
	@echo "$(BLUE)清理镜像...$(NC)"
	$(DOCKER_COMPOSE) down --rmi all
	@echo "$(GREEN)✓ 镜像清理完成$(NC)"

.PHONY: clean-all
clean-all: ## 清理所有（包括未使用的镜像）
	@echo "$(BLUE)清理所有...$(NC)"
	$(DOCKER_COMPOSE) down -v --rmi all
	$(DOCKER) system prune -af
	@echo "$(GREEN)✓ 清理完成$(NC)"

# ============================================================
# 重建
# ============================================================

.PHONY: rebuild
rebuild: clean build ## 重新构建（清理+构建）
	@echo "$(GREEN)✓ 重建完成$(NC)"

.PHONY: rebuild-frontend
rebuild-frontend: ## 重新构建前端
	@echo "$(BLUE)重新构建前端...$(NC)"
	$(DOCKER_COMPOSE) build --no-cache aicatpin
	@echo "$(GREEN)✓ 前端重建完成$(NC)"

.PHONY: reset
reset: clean build ## 完全重置（清理+构建）
	@echo "$(GREEN)✓ 完全重置完成$(NC)"

.PHONY: reset-all
reset-all: clean-all build ## 完全重置（包括所有数据）
	@echo "$(GREEN)✓ 完全重置完成$(NC)"

# ============================================================
# 服务管理
# ============================================================

.PHONY: start
start: env ## 启动所有服务
	@echo "$(BLUE)启动所有服务...$(NC)"
	$(DOCKER_COMPOSE) up -d
	@echo "$(GREEN)✓ 所有服务已启动$(NC)"

.PHONY: stop
stop: ## 停止所有服务
	@echo "$(BLUE)停止所有服务...$(NC)"
	$(DOCKER_COMPOSE) down
	@echo "$(GREEN)✓ 所有服务已停止$(NC)"

.PHONY: restart
restart: ## 重启所有服务
	@echo "$(BLUE)重启所有服务...$(NC)"
	$(DOCKER_COMPOSE) restart
	@echo "$(GREEN)✓ 所有服务已重启$(NC)"

.PHONY: status
status: ## 查看服务状态
	@echo "$(BLUE)查看服务状态...$(NC)"
	$(DOCKER_COMPOSE) ps

.PHONY: logs
logs: ## 查看所有服务日志
	@echo "$(BLUE)查看所有服务日志...$(NC)"
	$(DOCKER_COMPOSE) logs -f

.PHONY: ps
ps: ## 查看容器状态
	@echo "$(BLUE)查看容器状态...$(NC)"
	$(DOCKER) ps -a

# ============================================================
# 进入容器
# ============================================================

.PHONY: shell
shell: ## 进入前端容器 Shell
	@echo "$(BLUE)进入前端容器 Shell...$(NC)"
	$(DOCKER_COMPOSE) exec aicatpin sh

.PHONY: db-shell
db-shell: ## 进入数据库 Shell
	@echo "$(BLUE)进入数据库 Shell...$(NC)"
	$(DOCKER_COMPOSE) exec supabase psql -U postgres

.PHONY: ollama-shell
ollama-shell: ## 进入 Ollama Shell
	@echo "$(BLUE)进入 Ollama Shell...$(NC)"
	$(DOCKER_COMPOSE) exec ollama bash

# ============================================================
# 快捷命令
# ============================================================

.PHONY: up
up: start ## 启动所有服务（别名）

.PHONY: down
down: stop ## 停止所有服务（别名）

.PHONY: reload
reload: restart ## 重启所有服务（别名）

# ============================================================
# 信息显示
# ============================================================

.PHONY: version
version: ## 显示版本信息
	@echo "$(CYAN)AICatPin v0.1.0 (Docker)$(NC)"
	@echo ""
	@echo "$(GREEN)Docker 版本:$(NC)"
	@$(DOCKER) --version
	@echo "$(GREEN)Docker Compose 版本:$(NC)"
	@$(DOCKER_COMPOSE) version

.PHONY: info
info: ## 显示项目信息
	@echo "$(CYAN)╔════════════════════════════════════════════════════════════╗$(NC)"
	@echo "$(CYAN)║              AICatPin Docker 项目信息                     ║$(NC)"
	@echo "$(CYAN)╚════════════════════════════════════════════════════════════╝$(NC)"
	@echo ""
	@echo "$(GREEN)项目名称:$(NC) AICatPin"
	@echo "$(GREEN)版本:$(NC) 0.1.0"
	@echo "$(GREEN)描述:$(NC) AI-Native Knowledge IDE"
	@echo ""
	@echo "$(GREEN)服务端口:$(NC)"
	@echo "  前端: http://localhost:$(FRONTEND_PORT)"
	@echo "  Supabase: http://localhost:$(SUPABASE_PORT)"
	@echo "  PostgreSQL: localhost:$(POSTGRES_PORT)"
	@echo "  Ollama: http://localhost:$(OLLAMA_PORT)"
	@echo "  Studio: http://localhost:$(STUDIO_PORT)"
	@echo ""
	@echo "$(GREEN)Docker 命令:$(NC)"
	@echo "  make dev          # 启动开发环境"
	@echo "  make start        # 启动所有服务"
	@echo "  make stop         # 停止所有服务"
	@echo "  make logs         # 查看日志"
	@echo "  make shell        # 进入容器"

# ============================================================
# 默认目标
# ============================================================

.DEFAULT_GOAL := help