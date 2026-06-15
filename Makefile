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
	@echo "  make dev          # 启动开发环境（仅前端）"
	@echo "  make start-all    # 启动所有服务（Supabase + Ollama + 前端）"
	@echo "  make rerun-all    # 重新构建并运行所有服务"
	@echo "  make status-all   # 查看所有服务状态"
	@echo "  make stop-all     # 停止所有服务"
	@echo "  make clean        # 清理容器和镜像"
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
	@if lsof -Pi :$(FRONTEND_PORT) -sTCP:LISTEN -t >/dev/null 2>&1; then \
		echo "$(YELLOW)⚠ 端口 $(FRONTEND_PORT) 已被占用$(NC)"; \
	else \
		echo "$(GREEN)✓ 端口 $(FRONTEND_PORT) 可用$(NC)"; \
	fi

# ============================================================
# 开发环境
# ============================================================

.PHONY: dev
dev: ## 启动开发环境（仅前端）
	@echo "$(BLUE)启动开发环境...$(NC)"
	$(DOCKER_COMPOSE) up -d aicatpin
	@echo "$(GREEN)✓ 开发环境已启动$(NC)"
	@echo ""
	@echo "$(GREEN)访问地址:$(NC)"
	@echo "  前端: http://localhost:$(FRONTEND_PORT)"

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

.PHONY: rerun
rerun: ## 重新运行（清理+构建+启动）
	@echo "$(BLUE)重新运行 AICatPin...$(NC)"
	@echo "$(BLUE)1. 停止现有容器...$(NC)"
	$(DOCKER_COMPOSE) down
	@echo "$(BLUE)2. 重新构建镜像...$(NC)"
	$(DOCKER_COMPOSE) build --no-cache aicatpin
	@echo "$(BLUE)3. 启动前端服务...$(NC)"
	$(DOCKER_COMPOSE) up -d aicatpin
	@echo "$(GREEN)✓ AICatPin 已重新运行$(NC)"
	@echo ""
	@echo "$(GREEN)访问地址:$(NC)"
	@echo "  前端: http://localhost:$(FRONTEND_PORT)"
	@echo ""
	@echo "$(YELLOW)注意: 请确保 Supabase 和 Ollama 服务已启动$(NC)"
	@echo "  运行: make start-all 启动所有服务"

# ============================================================
# 构建
# ============================================================

.PHONY: build
build: ## 构建 Docker 镜像
	@echo "$(BLUE)构建 Docker 镜像...$(NC)"
	$(DOCKER_COMPOSE) build aicatpin
	@echo "$(GREEN)✓ Docker 镜像构建完成$(NC)"

.PHONY: build-no-cache
build-no-cache: ## 无缓存构建
	@echo "$(BLUE)无缓存构建...$(NC)"
	$(DOCKER_COMPOSE) build --no-cache aicatpin
	@echo "$(GREEN)✓ 无缓存构建完成$(NC)"

# ============================================================
# 清理
# ============================================================

.PHONY: clean
clean: ## 清理容器和镜像
	@echo "$(BLUE)清理容器和镜像...$(NC)"
	$(DOCKER_COMPOSE) down --rmi local
	@echo "$(GREEN)✓ 清理完成$(NC)"

.PHONY: clean-all
clean-all: ## 清理所有（包括未使用的镜像）
	@echo "$(BLUE)清理所有...$(NC)"
	$(DOCKER_COMPOSE) down -v --rmi all
	$(DOCKER) system prune -f
	@echo "$(GREEN)✓ 清理完成$(NC)"

# ============================================================
# 服务管理
# ============================================================

.PHONY: start
start: ## 启动前端服务
	@echo "$(BLUE)启动前端服务...$(NC)"
	$(DOCKER_COMPOSE) up -d aicatpin
	@echo "$(GREEN)✓ 前端服务已启动$(NC)"

.PHONY: stop
stop: ## 停止所有服务
	@echo "$(BLUE)停止所有服务...$(NC)"
	$(DOCKER_COMPOSE) down
	@echo "$(GREEN)✓ 所有服务已停止$(NC)"

.PHONY: restart
restart: ## 重启前端服务
	@echo "$(BLUE)重启前端服务...$(NC)"
	$(DOCKER_COMPOSE) restart aicatpin
	@echo "$(GREEN)✓ 前端服务已重启$(NC)"

.PHONY: status
status: ## 查看服务状态
	@echo "$(BLUE)查看服务状态...$(NC)"
	$(DOCKER_COMPOSE) ps

.PHONY: logs
logs: ## 查看前端服务日志
	@echo "$(BLUE)查看前端服务日志...$(NC)"
	$(DOCKER_COMPOSE) logs -f aicatpin

# ============================================================
# 完整服务管理
# ============================================================

.PHONY: start-supabase
start-supabase: ## 启动 Supabase 服务
	@echo "$(BLUE)启动 Supabase...$(NC)"
	@if command -v supabase >/dev/null 2>&1; then \
		supabase start; \
	else \
		echo "$(RED)错误: Supabase CLI 未安装$(NC)"; \
		echo "安装命令: npm install -g supabase"; \
		exit 1; \
	fi
	@echo "$(GREEN)✓ Supabase 已启动$(NC)"

.PHONY: stop-supabase
stop-supabase: ## 停止 Supabase 服务
	@echo "$(BLUE)停止 Supabase...$(NC)"
	@supabase stop 2>/dev/null || true
	@echo "$(GREEN)✓ Supabase 已停止$(NC)"

.PHONY: start-ollama
start-ollama: ## 启动 Ollama 服务
	@echo "$(BLUE)启动 Ollama...$(NC)"
	@if command -v ollama >/dev/null 2>&1; then \
		if curl -s --max-time 2 http://localhost:11434/ >/dev/null 2>&1; then \
			echo "$(GREEN)✓ Ollama 已在运行$(NC)"; \
		else \
			ollama serve & \
			sleep 3; \
			echo "$(GREEN)✓ Ollama 已启动$(NC)"; \
		fi; \
	else \
		echo "$(RED)错误: Ollama 未安装$(NC)"; \
		echo "安装命令: curl -fsSL https://ollama.ai/install.sh | sh"; \
		exit 1; \
	fi

.PHONY: stop-ollama
stop-ollama: ## 停止 Ollama 服务
	@echo "$(BLUE)停止 Ollama...$(NC)"
	@pkill ollama 2>/dev/null || true
	@echo "$(GREEN)✓ Ollama 已停止$(NC)"

.PHONY: start-all
start-all: start-supabase start-ollama start ## 启动所有服务（Supabase + Ollama + 前端）
	@echo ""
	@echo "$(GREEN)╔════════════════════════════════════════════════════════════╗$(NC)"
	@echo "$(GREEN)║                    所有服务已启动                          ║$(NC)"
	@echo "$(GREEN)╚════════════════════════════════════════════════════════════╝$(NC)"
	@echo ""
	@echo "$(GREEN)服务地址:$(NC)"
	@echo "  • Supabase API:  http://localhost:54321"
	@echo "  • Supabase UI:   http://localhost:54323"
	@echo "  • Ollama:        http://localhost:11434"
	@echo "  • 前端应用:      http://localhost:$(FRONTEND_PORT)"
	@echo ""

.PHONY: stop-all
stop-all: stop-ollama stop-supabase stop ## 停止所有服务（Supabase + Ollama + 前端）
	@echo "$(GREEN)✓ 所有服务已停止$(NC)"

.PHONY: restart-all
restart-all: stop-all start-all ## 重启所有服务

.PHONY: status-all
status-all: ## 查看所有服务状态
	@echo "$(BLUE)查看所有服务状态...$(NC)"
	@echo ""
	@echo "$(BLUE)Supabase:$(NC)"
	@if command -v supabase >/dev/null 2>&1; then \
		supabase status 2>/dev/null || echo "  未运行"; \
	else \
		echo "  未安装"; \
	fi
	@echo ""
	@echo "$(BLUE)Ollama:$(NC)"
	@if curl -s --max-time 2 http://localhost:11434/ >/dev/null 2>&1; then \
		echo "  运行中"; \
		ollama list 2>/dev/null | head -5 || true; \
	else \
		echo "  未运行"; \
	fi
	@echo ""
	@echo "$(BLUE)前端服务:$(NC)"
	@$(DOCKER_COMPOSE) ps
	@echo ""

.PHONY: rerun-all
rerun-all: ## 重新运行所有服务（清理+构建+启动）
	@echo "$(BLUE)重新运行 AICatPin（完整版）...$(NC)"
	@echo "$(BLUE)1. 停止所有服务...$(NC)"
	@$(MAKE) stop-all
	@echo ""
	@echo "$(BLUE)2. 重新构建镜像...$(NC)"
	@$(DOCKER_COMPOSE) build --no-cache aicatpin
	@echo ""
	@echo "$(BLUE)3. 启动所有服务...$(NC)"
	@$(MAKE) start-all

# ============================================================
# 进入容器
# ============================================================

.PHONY: shell
shell: ## 进入前端容器 Shell
	@echo "$(BLUE)进入前端容器 Shell...$(NC)"
	$(DOCKER_COMPOSE) exec aicatpin sh

# ============================================================
# 快捷命令
# ============================================================

.PHONY: up
up: start ## 启动前端服务（别名）

.PHONY: down
down: stop ## 停止所有服务（别名）

.PHONY: reload
reload: restart ## 重启前端服务（别名）

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
	@echo ""
	@echo "$(GREEN)Docker 命令:$(NC)"
	@echo "  make dev          # 启动开发环境"
	@echo "  make start        # 启动前端服务"
	@echo "  make stop         # 停止所有服务"
	@echo "  make logs         # 查看日志"
	@echo "  make shell        # 进入容器"

# ============================================================
# 默认目标
# ============================================================

.DEFAULT_GOAL := help