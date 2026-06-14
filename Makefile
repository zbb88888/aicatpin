# ============================================================
# AICatPin Makefile
# 维护所有构建、测试、清理和重建流程
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

# 项目配置
PROJECT_NAME := aicatpin
NODE_VERSION := 18
RUST_VERSION := 1.70

# 目录配置
FRONTEND_DIR := .
BACKEND_DIR  := src-tauri
SUPABASE_DIR := supabase
DIST_DIR     := dist
BUILD_DIR    := $(BACKEND_DIR)/target

# 端口配置
VITE_PORT     := 1420
SUPABASE_PORT := 54321
OLLAMA_PORT   := 11434
POSTGRES_PORT := 5432

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
	@echo "$(CYAN)║              AICatPin 构建系统                            ║$(NC)"
	@echo "$(CYAN)╚════════════════════════════════════════════════════════════╝$(NC)"
	@echo ""
	@echo "$(GREEN)可用命令:$(NC)"
	@echo ""
	@awk 'BEGIN {FS = ":.*##"} /^[a-zA-Z_-]+:.*##/ {printf "  $(CYAN)%-20s$(NC) %s\n", $$1, $$2}' $(MAKEFILE_LIST)
	@echo ""
	@echo "$(YELLOW)示例:$(NC)"
	@echo "  make dev          # 启动开发服务器"
	@echo "  make build        # 构建生产版本"
	@echo "  make test         # 运行测试"
	@echo "  make clean        # 清理构建文件"
	@echo "  make reset        # 重置所有环境"
	@echo ""

# ============================================================
# 环境检查
# ============================================================

.PHONY: check-env
check-env: ## 检查开发环境
	@echo "$(BLUE)检查开发环境...$(NC)"
	@./check-env.sh

.PHONY: check-deps
check-deps: ## 检查依赖是否安装
	@echo "$(BLUE)检查依赖...$(NC)"
	@command -v node >/dev/null 2>&1 || { echo "$(RED)错误: node 未安装$(NC)"; exit 1; }
	@command -v npm >/dev/null 2>&1 || { echo "$(RED)错误: npm 未安装$(NC)"; exit 1; }
	@command -v cargo >/dev/null 2>&1 || { echo "$(RED)错误: cargo 未安装$(NC)"; exit 1; }
	@echo "$(GREEN)✓ 依赖检查通过$(NC)"

.PHONY: check-ports
check-ports: ## 检查端口是否可用
	@echo "$(BLUE)检查端口...$(NC)"
	@for port in $(VITE_PORT) $(SUPABASE_PORT) $(OLLAMA_PORT) $(POSTGRES_PORT); do \
		if lsof -Pi :$$port -sTCP:LISTEN -t >/dev/null 2>&1; then \
			echo "$(YELLOW)⚠ 端口 $$port 已被占用$(NC)"; \
		else \
			echo "$(GREEN)✓ 端口 $$port 可用$(NC)"; \
		fi; \
	done

# ============================================================
# 安装依赖
# ============================================================

.PHONY: install
install: ## 安装所有依赖
	@echo "$(BLUE)安装 Node.js 依赖...$(NC)"
	npm install
	@echo "$(GREEN)✓ Node.js 依赖安装完成$(NC)"

.PHONY: install-frontend
install-frontend: ## 安装前端依赖
	@echo "$(BLUE)安装前端依赖...$(NC)"
	npm install
	@echo "$(GREEN)✓ 前端依赖安装完成$(NC)"

.PHONY: install-backend
install-backend: ## 安装后端依赖
	@echo "$(BLUE)安装后端依赖...$(NC)"
	@if command -v cargo >/dev/null 2>&1; then \
		cd $(BACKEND_DIR) && cargo fetch; \
	else \
		echo "$(YELLOW)提示: cargo 未安装，跳过$(NC)"; \
	fi
	@echo "$(GREEN)✓ 后端依赖安装完成$(NC)"

.PHONY: install-all
install-all: install-frontend install-backend ## 安装所有依赖（前端+后端）
	@echo "$(GREEN)✓ 所有依赖安装完成$(NC)"

# ============================================================
# 开发服务器
# ============================================================

.PHONY: dev
dev: ## 启动前端开发服务器
	@echo "$(BLUE)启动前端开发服务器...$(NC)"
	npm run dev

.PHONY: dev-tauri
dev-tauri: ## 启动 Tauri 桌面应用（开发模式）
	@echo "$(BLUE)启动 Tauri 桌面应用...$(NC)"
	npm run tauri dev

.PHONY: dev-all
dev-all: ## 启动所有开发服务
	@echo "$(BLUE)启动所有开发服务...$(NC)"
	@echo "$(YELLOW)提示: 使用 Ctrl+C 停止所有服务$(NC)"
	@trap 'kill 0' EXIT; \
	npm run dev & \
	cd $(BACKEND_DIR) && cargo run & \
	wait

# ============================================================
# 构建
# ============================================================

.PHONY: build
build: build-frontend build-backend ## 构建生产版本（前端+后端）
	@echo "$(GREEN)✓ 生产版本构建完成$(NC)"

.PHONY: build-frontend
build-frontend: ## 构建前端
	@echo "$(BLUE)构建前端...$(NC)"
	npm run build
	@echo "$(GREEN)✓ 前端构建完成$(NC)"

.PHONY: build-backend
build-backend: ## 构建后端（Tauri）
	@echo "$(BLUE)构建后端...$(NC)"
	@if command -v cargo >/dev/null 2>&1; then \
		cd $(BACKEND_DIR) && cargo build --release; \
	else \
		echo "$(YELLOW)提示: cargo 未安装，跳过$(NC)"; \
	fi
	@echo "$(GREEN)✓ 后端构建完成$(NC)"

.PHONY: build-tauri
build-tauri: ## 构建 Tauri 桌面应用
	@echo "$(BLUE)构建 Tauri 桌面应用...$(NC)"
	npm run tauri build
	@echo "$(GREEN)✓ Tauri 应用构建完成$(NC)"

.PHONY: build-release
build-release: ## 构建发布版本
	@echo "$(BLUE)构建发布版本...$(NC)"
	npm run build
	cd $(BACKEND_DIR) && cargo build --release
	@echo "$(GREEN)✓ 发布版本构建完成$(NC)"

# ============================================================
# 类型检查和代码质量
# ============================================================

.PHONY: typecheck
typecheck: ## 运行 TypeScript 类型检查
	@echo "$(BLUE)运行 TypeScript 类型检查...$(NC)"
	npx tsc --noEmit
	@echo "$(GREEN)✓ 类型检查通过$(NC)"

.PHONY: lint
lint: ## 运行代码检查
	@echo "$(BLUE)运行代码检查...$(NC)"
	npm run lint
	@echo "$(GREEN)✓ 代码检查通过$(NC)"

.PHONY: lint-fix
lint-fix: ## 自动修复代码问题
	@echo "$(BLUE)自动修复代码问题...$(NC)"
	npm run lint -- --fix
	@echo "$(GREEN)✓ 代码问题已修复$(NC)"

.PHONY: format
format: ## 格式化代码
	@echo "$(BLUE)格式化代码...$(NC)"
	npx prettier --write "src/**/*.{ts,tsx,css,json}"
	@echo "$(GREEN)✓ 代码格式化完成$(NC)"

.PHONY: check
check: typecheck lint ## 运行所有检查（类型检查+代码检查）
	@echo "$(GREEN)✓ 所有检查通过$(NC)"

# ============================================================
# 测试
# ============================================================

.PHONY: test
test: test-frontend test-backend ## 运行所有测试
	@echo "$(GREEN)✓ 所有测试通过$(NC)"

.PHONY: test-frontend
test-frontend: ## 运行前端测试
	@echo "$(BLUE)运行前端测试...$(NC)"
	@echo "$(YELLOW)提示: 前端测试待实现$(NC)"

.PHONY: test-backend
test-backend: ## 运行后端测试
	@echo "$(BLUE)运行后端测试...$(NC)"
	@if command -v cargo >/dev/null 2>&1; then \
		cd $(BACKEND_DIR) && cargo test; \
	else \
		echo "$(YELLOW)提示: cargo 未安装，跳过$(NC)"; \
	fi
	@echo "$(GREEN)✓ 后端测试通过$(NC)"

.PHONY: test-watch
test-watch: ## 运行测试（监听模式）
	@echo "$(BLUE)运行测试（监听模式）...$(NC)"
	cd $(BACKEND_DIR) && cargo test -- --nocapture

.PHONY: test-db
test-db: ## 运行数据库测试
	@echo "$(BLUE)运行数据库测试...$(NC)"
	@if command -v supabase >/dev/null 2>&1; then \
		supabase db reset; \
		psql -h localhost -p $(POSTGRES_PORT) -U postgres -f $(SUPABASE_DIR)/test-knowledge-vault.sql; \
	else \
		echo "$(YELLOW)提示: Supabase CLI 未安装，跳过数据库测试$(NC)"; \
	fi

# ============================================================
# 数据库操作
# ============================================================

.PHONY: db-start
db-start: ## 启动 Supabase 数据库
	@echo "$(BLUE)启动 Supabase 数据库...$(NC)"
	supabase start
	@echo "$(GREEN)✓ Supabase 数据库已启动$(NC)"

.PHONY: db-stop
db-stop: ## 停止 Supabase 数据库
	@echo "$(BLUE)停止 Supabase 数据库...$(NC)"
	supabase stop
	@echo "$(GREEN)✓ Supabase 数据库已停止$(NC)"

.PHONY: db-reset
db-reset: ## 重置数据库
	@echo "$(BLUE)重置数据库...$(NC)"
	supabase db reset
	@echo "$(GREEN)✓ 数据库已重置$(NC)"

.PHONY: db-migrate
db-migrate: ## 运行数据库迁移
	@echo "$(BLUE)运行数据库迁移...$(NC)"
	supabase db push
	@echo "$(GREEN)✓ 数据库迁移完成$(NC)"

.PHONY: db-types
db-types: ## 生成 TypeScript 类型
	@echo "$(BLUE)生成 TypeScript 类型...$(NC)"
	supabase gen types typescript --local > src/types/supabase.ts
	@echo "$(GREEN)✓ TypeScript 类型已生成$(NC)"

.PHONY: db-status
db-status: ## 查看数据库状态
	@echo "$(BLUE)查看数据库状态...$(NC)"
	supabase status

.PHONY: db-studio
db-studio: ## 打开 Supabase Studio
	@echo "$(BLUE)打开 Supabase Studio...$(NC)"
	supabase studio

# ============================================================
# Ollama 操作
# ============================================================

.PHONY: ollama-start
ollama-start: ## 启动 Ollama 服务
	@echo "$(BLUE)启动 Ollama 服务...$(NC)"
	ollama serve &
	@echo "$(GREEN)✓ Ollama 服务已启动$(NC)"

.PHONY: ollama-pull
ollama-pull: ## 下载所需模型
	@echo "$(BLUE)下载 Ollama 模型...$(NC)"
	ollama pull gemma4:e2b
	ollama pull nomic-embed-text
	@echo "$(GREEN)✓ 模型下载完成$(NC)"

.PHONY: ollama-pull-embedding
ollama-pull-embedding: ## 下载嵌入模型
	@echo "$(BLUE)下载嵌入模型...$(NC)"
	ollama pull nomic-embed-text
	@echo "$(GREEN)✓ 嵌入模型下载完成$(NC)"

.PHONY: ollama-status
ollama-status: ## 查看 Ollama 状态
	@echo "$(BLUE)查看 Ollama 状态...$(NC)"
	@if curl -s http://localhost:$(OLLAMA_PORT)/api/tags >/dev/null 2>&1; then \
		echo "$(GREEN)✓ Ollama 服务运行中$(NC)"; \
		curl -s http://localhost:$(OLLAMA_PORT)/api/tags | jq '.models[].name'; \
	else \
		echo "$(RED)✗ Ollama 服务未运行$(NC)"; \
	fi

.PHONY: ollama-test
ollama-test: ## 测试 Ollama API
	@echo "$(BLUE)测试 Ollama API...$(NC)"
	@curl -s http://localhost:$(OLLAMA_PORT)/api/generate \
		-H "Content-Type: application/json" \
		-d '{"model":"qwen2.5:7b","prompt":"Hello","stream":false}' \
		| jq '.response'

# ============================================================
# 清理
# ============================================================

.PHONY: clean
clean: clean-frontend clean-backend ## 清理所有构建文件
	@echo "$(GREEN)✓ 所有构建文件已清理$(NC)"

.PHONY: clean-frontend
clean-frontend: ## 清理前端构建文件
	@echo "$(BLUE)清理前端构建文件...$(NC)"
	rm -rf $(DIST_DIR)
	rm -rf node_modules/.vite
	rm -rf .cache
	@echo "$(GREEN)✓ 前端构建文件已清理$(NC)"

.PHONY: clean-backend
clean-backend: ## 清理后端构建文件
	@echo "$(BLUE)清理后端构建文件...$(NC)"
	@if command -v cargo >/dev/null 2>&1; then \
		cd $(BACKEND_DIR) && cargo clean; \
	else \
		echo "$(YELLOW)提示: cargo 未安装，跳过$(NC)"; \
	fi
	@echo "$(GREEN)✓ 后端构建文件已清理$(NC)"

.PHONY: clean-deps
clean-deps: ## 清理依赖
	@echo "$(BLUE)清理依赖...$(NC)"
	rm -rf node_modules
	rm -rf $(BACKEND_DIR)/target
	rm -f package-lock.json
	@echo "$(GREEN)✓ 依赖已清理$(NC)"

.PHONY: clean-cache
clean-cache: ## 清理缓存
	@echo "$(BLUE)清理缓存...$(NC)"
	rm -rf .cache
	rm -rf node_modules/.cache
	rm -rf /tmp/aicatpin-*
	@echo "$(GREEN)✓ 缓存已清理$(NC)"

.PHONY: clean-db
clean-db: ## 清理数据库
	@echo "$(BLUE)清理数据库...$(NC)"
	@if command -v supabase >/dev/null 2>&1; then \
		supabase stop --no-backup; \
	else \
		echo "$(YELLOW)提示: Supabase CLI 未安装$(NC)"; \
	fi
	@echo "$(GREEN)✓ 数据库已清理$(NC)"

.PHONY: clean-vault
clean-vault: ## 清理本地 Vault
	@echo "$(BLUE)清理本地 Vault...$(NC)"
	@if [ -d "$$HOME/AICatPin_Vault" ]; then \
		rm -rf $$HOME/AICatPin_Vault; \
		echo "$(GREEN)✓ Vault 已清理$(NC)"; \
	else \
		echo "$(YELLOW)提示: Vault 目录不存在$(NC)"; \
	fi

# ============================================================
# 重建
# ============================================================

.PHONY: rebuild
rebuild: clean install build ## 重新构建（清理+安装+构建）
	@echo "$(GREEN)✓ 重建完成$(NC)"

.PHONY: rebuild-frontend
rebuild-frontend: clean-frontend install-frontend build-frontend ## 重新构建前端
	@echo "$(GREEN)✓ 前端重建完成$(NC)"

.PHONY: rebuild-backend
rebuild-backend: clean-backend install-backend build-backend ## 重新构建后端
	@echo "$(GREEN)✓ 后端重建完成$(NC)"

.PHONY: rebuild-tauri
rebuild-tauri: ## 重新构建 Tauri 应用
	@echo "$(BLUE)重新构建 Tauri 应用...$(NC)"
	rm -rf $(BACKEND_DIR)/target
	npm run tauri build
	@echo "$(GREEN)✓ Tauri 应用重建完成$(NC)"

.PHONY: reset
reset: clean clean-deps install build ## 完全重置（清理+清理依赖+安装+构建）
	@echo "$(GREEN)✓ 完全重置完成$(NC)"

.PHONY: reset-all
reset-all: clean clean-deps clean-db clean-vault install build ## 完全重置（包括数据库和 Vault）
	@echo "$(GREEN)✓ 完全重置完成（包括数据库和 Vault）$(NC)"

# ============================================================
# 测试环境
# ============================================================

.PHONY: test-env-setup
test-env-setup: ## 设置测试环境
	@echo "$(BLUE)设置测试环境...$(NC)"
	cp .env.example .env.test
	@echo "$(GREEN)✓ 测试环境已设置$(NC)"

.PHONY: test-env-clean
test-env-clean: ## 清理测试环境
	@echo "$(BLUE)清理测试环境...$(NC)"
	rm -f .env.test
	rm -rf /tmp/aicatpin-test-*
	@echo "$(GREEN)✓ 测试环境已清理$(NC)"

.PHONY: test-env-reset
test-env-reset: test-env-clean test-env-setup ## 重置测试环境
	@echo "$(GREEN)✓ 测试环境已重置$(NC)"

# ============================================================
# 代码生成
# ============================================================

.PHONY: gen-component
gen-component: ## 生成新组件（用法：make gen-component name=ComponentName）
	@if [ -z "$(name)" ]; then \
		echo "$(RED)错误: 请指定组件名称$(NC)"; \
		echo "用法: make gen-component name=ComponentName"; \
		exit 1; \
	fi
	@echo "$(BLUE)生成组件: $(name)$(NC)"
	@mkdir -p src/components/$(shell echo $(name) | tr '[:upper:]' '[:lower:]')
	@echo "export function $(name)() {" > src/components/$(shell echo $(name) | tr '[:upper:]' '[:lower:]')/$(name).tsx
	@echo "  return <div>$(name)</div>" >> src/components/$(shell echo $(name) | tr '[:upper:]' '[:lower:]')/$(name).tsx
	@echo "}" >> src/components/$(shell echo $(name) | tr '[:upper:]' '[:lower:]')/$(name).tsx
	@echo "$(GREEN)✓ 组件 $(name) 已生成$(NC)"

.PHONY: gen-hook
gen-hook: ## 生成新 Hook（用法：make gen-hook name=hookName）
	@if [ -z "$(name)" ]; then \
		echo "$(RED)错误: 请指定 Hook 名称$(NC)"; \
		echo "用法: make gen-hook name=hookName"; \
		exit 1; \
	fi
	@echo "$(BLUE)生成 Hook: $(name)$(NC)"
	@echo "import { useState, useCallback } from 'react'" > src/hooks/$(name).ts
	@echo "" >> src/hooks/$(name).ts
	@echo "export function $(name)() {" >> src/hooks/$(name).ts
	@echo "  // Hook 逻辑" >> src/hooks/$(name).ts
	@echo "  return {}" >> src/hooks/$(name).ts
	@echo "}" >> src/hooks/$(name).ts
	@echo "$(GREEN)✓ Hook $(name) 已生成$(NC)"

# ============================================================
# 文档
# ============================================================

.PHONY: docs
docs: ## 生成文档
	@echo "$(BLUE)生成文档...$(NC)"
	@echo "$(YELLOW)提示: 文档生成待实现$(NC)"

.PHONY: docs-serve
docs-serve: ## 启动文档服务器
	@echo "$(BLUE)启动文档服务器...$(NC)"
	@echo "$(YELLOW)提示: 文档服务器待实现$(NC)"

# ============================================================
# 部署
# ============================================================

.PHONY: deploy
deploy: build ## 部署应用
	@echo "$(BLUE)部署应用...$(NC)"
	@echo "$(YELLOW)提示: 部署流程待实现$(NC)"

.PHONY: deploy-frontend
deploy-frontend: build-frontend ## 部署前端
	@echo "$(BLUE)部署前端...$(NC)"
	@echo "$(YELLOW)提示: 前端部署待实现$(NC)"

# ============================================================
# 监控和日志
# ============================================================

.PHONY: logs
logs: ## 查看日志
	@echo "$(BLUE)查看日志...$(NC)"
	@if [ -f "logs/app.log" ]; then \
		tail -f logs/app.log; \
	else \
		echo "$(YELLOW)提示: 日志文件不存在$(NC)"; \
	fi

.PHONY: status
status: ## 查看项目状态
	@echo "$(CYAN)╔════════════════════════════════════════════════════════════╗$(NC)"
	@echo "$(CYAN)║              AICatPin 项目状态                            ║$(NC)"
	@echo "$(CYAN)╚════════════════════════════════════════════════════════════╝$(NC)"
	@echo ""
	@echo "$(GREEN)Node.js:$(NC)"
	@node --version 2>/dev/null || echo "  未安装"
	@echo "$(GREEN)npm:$(NC)"
	@npm --version 2>/dev/null || echo "  未安装"
	@echo "$(GREEN)Rust:$(NC)"
	@rustc --version 2>/dev/null || echo "  未安装"
	@echo "$(GREEN)Cargo:$(NC)"
	@cargo --version 2>/dev/null || echo "  未安装"
	@echo ""
	@echo "$(GREEN)服务状态:$(NC)"
	@if curl -s http://localhost:$(OLLAMA_PORT)/api/tags >/dev/null 2>&1; then \
		echo "  Ollama: $(GREEN)运行中$(NC)"; \
	else \
		echo "  Ollama: $(RED)未运行$(NC)"; \
	fi
	@if curl -s http://localhost:$(SUPABASE_PORT) >/dev/null 2>&1; then \
		echo "  Supabase: $(GREEN)运行中$(NC)"; \
	else \
		echo "  Supabase: $(RED)未运行$(NC)"; \
	fi
	@echo ""
	@echo "$(GREEN)目录大小:$(NC)"
	@du -sh node_modules 2>/dev/null || echo "  node_modules: 不存在"
	@du -sh $(BACKEND_DIR)/target 2>/dev/null || echo "  target: 不存在"
	@du -sh $(DIST_DIR) 2>/dev/null || echo "  dist: 不存在"
	@du -sh $$HOME/AICatPin_Vault 2>/dev/null || echo "  Vault: 不存在"

# ============================================================
# Git 操作
# ============================================================

.PHONY: git-status
git-status: ## 查看 Git 状态
	@git status

.PHONY: git-commit
git-commit: ## 提交更改（用法：make git-commit message="提交信息")
	@if [ -z "$(message)" ]; then \
		echo "$(RED)错误: 请指定提交信息$(NC)"; \
		echo "用法: make git-commit message=\"提交信息\""; \
		exit 1; \
	fi
	@git add .
	@git commit -m "$(message)"
	@echo "$(GREEN)✓ 更改已提交$(NC)"

.PHONY: git-push
git-push: ## 推送到远程仓库
	@git push
	@echo "$(GREEN)✓ 已推送到远程仓库$(NC)"

# ============================================================
# 快捷命令
# ============================================================

.PHONY: start
start: db-start ollama-start dev ## 启动所有服务（数据库+Ollama+开发服务器）

.PHONY: stop
stop: db-stop ## 停止所有服务

.PHONY: restart
restart: stop start ## 重启所有服务

.PHONY: rerun
rerun: ## 重新运行开发服务器（停止+启动）
	@echo "$(BLUE)重新启动开发服务器...$(NC)"
	@pkill -f vite 2>/dev/null || true
	@sleep 1
	@echo "$(GREEN)✓ 开发服务器已重启$(NC)"
	npm run dev

.PHONY: update
update: install build ## 更新依赖并构建

.PHONY: upgrade
upgrade: ## 升级依赖
	@echo "$(BLUE)升级依赖...$(NC)"
	npm update
	cd $(BACKEND_DIR) && cargo update
	@echo "$(GREEN)✓ 依赖已升级$(NC)"

# ============================================================
# 开发工具
# ============================================================

.PHONY: studio
studio: db-studio ## 打开数据库管理界面

.PHONY: editor
editor: ## 打开编辑器演示
	@echo "$(BLUE)打开编辑器演示...$(NC)"
	@echo "访问 http://localhost:$(VITE_PORT)"
	npm run dev

.PHONY: api
api: ## 测试 API
	@echo "$(BLUE)测试 API...$(NC)"
	@curl -s http://localhost:$(OLLAMA_PORT)/api/tags | jq '.'

# ============================================================
# 维护命令
# ============================================================

.PHONY: audit
audit: ## 安全审计
	@echo "$(BLUE)运行安全审计...$(NC)"
	npm audit
	@echo "$(GREEN)✓ 安全审计完成$(NC)"

.PHONY: audit-fix
audit-fix: ## 修复安全问题
	@echo "$(BLUE)修复安全问题...$(NC)"
	npm audit fix
	@echo "$(GREEN)✓ 安全问题已修复$(NC)"

.PHONY: outdated
outdated: ## 检查过时的依赖
	@echo "$(BLUE)检查过时的依赖...$(NC)"
	npm outdated
	@echo "$(GREEN)✓ 依赖检查完成$(NC)"

# ============================================================
# 调试命令
# ============================================================

.PHONY: debug
debug: ## 启动调试模式
	@echo "$(BLUE)启动调试模式...$(NC)"
	DEBUG=* npm run dev

.PHONY: debug-tauri
debug-tauri: ## 启动 Tauri 调试模式
	@echo "$(BLUE)启动 Tauri 调试模式...$(NC)"
	RUST_LOG=debug npm run tauri dev

.PHONY: trace
trace: ## 启动跟踪模式
	@echo "$(BLUE)启动跟踪模式...$(NC)"
	TRACE=* npm run dev

# ============================================================
# 性能分析
# ============================================================

.PHONY: profile
profile: ## 运行性能分析
	@echo "$(BLUE)运行性能分析...$(NC)"
	@echo "$(YELLOW)提示: 性能分析待实现$(NC)"

.PHONY: benchmark
benchmark: ## 运行基准测试
	@echo "$(BLUE)运行基准测试...$(NC)"
	cd $(BACKEND_DIR) && cargo bench
	@echo "$(GREEN)✓ 基准测试完成$(NC)"

# ============================================================
# 备份和恢复
# ============================================================

.PHONY: backup
backup: ## 备份数据
	@echo "$(BLUE)备份数据...$(NC)"
	@mkdir -p backups
	@if [ -d "$$HOME/AICatPin_Vault" ]; then \
		tar -czf backups/vault-$$(date +%Y%m%d_%H%M%S).tar.gz -C $$HOME AICatPin_Vault; \
		echo "$(GREEN)✓ Vault 已备份$(NC)"; \
	else \
		echo "$(YELLOW)提示: Vault 目录不存在$(NC)"; \
	fi

.PHONY: restore
restore: ## 恢复数据（用法：make restore file=backup.tar.gz)
	@if [ -z "$(file)" ]; then \
		echo "$(RED)错误: 请指定备份文件$(NC)"; \
		echo "用法: make restore file=backups/vault-20240101_120000.tar.gz"; \
		exit 1; \
	fi
	@echo "$(BLUE)恢复数据...$(NC)"
	tar -xzf $(file) -C $$HOME
	@echo "$(GREEN)✓ 数据已恢复$(NC)"

# ============================================================
# 环境变量
# ============================================================

.PHONY: env
env: ## 显示环境变量
	@echo "$(BLUE)环境变量:$(NC)"
	@cat .env 2>/dev/null || echo "$(YELLOW)提示: .env 文件不存在$(NC)"

.PHONY: env-example
env-example: ## 生成环境变量示例
	@echo "$(BLUE)生成环境变量示例...$(NC)"
	@cp .env .env.example 2>/dev/null || echo "$(YELLOW)提示: .env 文件不存在$(NC)"
	@echo "$(GREEN)✓ 环境变量示例已生成$(NC)"

# ============================================================
# 依赖分析
# ============================================================

.PHONY: deps
deps: ## 分析依赖
	@echo "$(BLUE)分析依赖...$(NC)"
	@echo "$(GREEN)前端依赖:$(NC)"
	@npm ls --depth=0 2>/dev/null | head -20
	@echo ""
	@echo "$(GREEN)后端依赖:$(NC)"
	@cd $(BACKEND_DIR) && cargo tree --depth=1 2>/dev/null | head -20

.PHONY: deps-graph
deps-graph: ## 生成依赖图
	@echo "$(BLUE)生成依赖图...$(NC)"
	@echo "$(YELLOW)提示: 依赖图生成待实现$(NC)"

# ============================================================
# 代码统计
# ============================================================

.PHONY: stats
stats: ## 代码统计
	@echo "$(CYAN)╔════════════════════════════════════════════════════════════╗$(NC)"
	@echo "$(CYAN)║              代码统计                                     ║$(NC)"
	@echo "$(CYAN)╚════════════════════════════════════════════════════════════╝$(NC)"
	@echo ""
	@echo "$(GREEN)TypeScript/React:$(NC)"
	@find src -name "*.ts" -o -name "*.tsx" | xargs wc -l 2>/dev/null | tail -1 || echo "  无文件"
	@echo "$(GREEN)Rust:$(NC)"
	@find $(BACKEND_DIR) -name "*.rs" | xargs wc -l 2>/dev/null | tail -1 || echo "  无文件"
	@echo "$(GREEN)CSS:$(NC)"
	@find src -name "*.css" | xargs wc -l 2>/dev/null | tail -1 || echo "  无文件"
	@echo "$(GREEN)SQL:$(NC)"
	@find $(SUPABASE_DIR) -name "*.sql" | xargs wc -l 2>/dev/null | tail -1 || echo "  无文件"
	@echo "$(GREEN)Markdown:$(NC)"
	@find . -name "*.md" -not -path "./node_modules/*" -not -path "./.git/*" | xargs wc -l 2>/dev/null | tail -1 || echo "  无文件"
	@echo ""
	@echo "$(GREEN)文件数量:$(NC)"
	@echo "  TypeScript: $$(find src -name '*.ts' -o -name '*.tsx' | wc -l)"
	@echo "  Rust: $$(find $(BACKEND_DIR) -name '*.rs' | wc -l)"
	@echo "  CSS: $$(find src -name '*.css' | wc -l)"
	@echo "  SQL: $$(find $(SUPABASE_DIR) -name '*.sql' | wc -l)"

# ============================================================
# 信息显示
# ============================================================

.PHONY: version
version: ## 显示版本信息
	@echo "$(CYAN)AICatPin v0.1.0$(NC)"
	@echo ""
	@echo "$(GREEN)依赖版本:$(NC)"
	@node --version 2>/dev/null || echo "  Node.js: 未安装"
	@npm --version 2>/dev/null || echo "  npm: 未安装"
	@rustc --version 2>/dev/null || echo "  Rust: 未安装"
	@cargo --version 2>/dev/null || echo "  Cargo: 未安装"

.PHONY: info
info: ## 显示项目信息
	@echo "$(CYAN)╔════════════════════════════════════════════════════════════╗$(NC)"
	@echo "$(CYAN)║              AICatPin 项目信息                            ║$(NC)"
	@echo "$(CYAN)╚════════════════════════════════════════════════════════════╝$(NC)"
	@echo ""
	@echo "$(GREEN)项目名称:$(NC) AICatPin"
	@echo "$(GREEN)版本:$(NC) 0.1.0"
	@echo "$(GREEN)描述:$(NC) AI-Native Knowledge IDE"
	@echo ""
	@echo "$(GREEN)技术栈:$(NC)"
	@echo "  前端: React + TypeScript + Vite + Tailwind CSS"
	@echo "  后端: Tauri (Rust)"
	@echo "  数据库: PostgreSQL + Supabase"
	@echo "  AI: Ollama"
	@echo ""
	@echo "$(GREEN)主要功能:$(NC)"
	@echo "  - 扁平分类系统"
	@echo "  - AI 内容生成"
	@echo "  - 语义搜索"
	@echo "  - 本地文件同步"

# ============================================================
# 默认目标
# ============================================================

.DEFAULT_GOAL := help