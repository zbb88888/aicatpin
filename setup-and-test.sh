#!/bin/bash

# ============================================================
# AICatPin 分步测试脚本
# 分步执行，避免超时
# ============================================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# 显示帮助
show_help() {
    echo -e "${BLUE}AICatPin 测试脚本${NC}"
    echo ""
    echo "用法: $0 <command>"
    echo ""
    echo "命令:"
    echo "  init      - 初始化 Supabase（首次需要，会下载 Docker 镜像）"
    echo "  start     - 启动所有服务"
    echo "  stop      - 停止所有服务"
    echo "  test      - 测试服务状态"
    echo "  full      - 启动服务并测试"
    echo "  help      - 显示帮助"
    echo ""
}

# 初始化 Supabase（下载镜像）
cmd_init() {
    echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║         初始化 Supabase（首次运行）                       ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    # 检查 Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker 未安装"
        exit 1
    fi
    
    # 检查 Supabase CLI
    if ! command -v supabase &> /dev/null; then
        log_info "安装 Supabase CLI..."
        npm install -g supabase
    fi
    
    # 初始化
    if [ ! -f "supabase/config.toml" ]; then
        log_info "初始化 Supabase..."
        supabase init --force
    fi
    
    log_info "下载 Supabase Docker 镜像（需要较长时间）..."
    log_info "请耐心等待，首次下载约需 5-10 分钟..."
    echo ""
    
    supabase start
    
    if [ $? -eq 0 ]; then
        echo ""
        log_success "Supabase 初始化完成！"
        log_info "后续使用 '$0 start' 启动服务"
    else
        log_error "Supabase 初始化失败"
        exit 1
    fi
}

# 启动所有服务
cmd_start() {
    echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║                    启动所有服务                           ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    # 1. 启动 Supabase
    log_info "[1/3] 启动 Supabase..."
    if curl -s --max-time 2 "http://localhost:54321/health" > /dev/null 2>&1; then
        log_success "Supabase 已在运行"
    else
        if command -v supabase &> /dev/null; then
            supabase start
        else
            log_error "Supabase CLI 未安装，请运行: $0 init"
            exit 1
        fi
    fi
    echo ""
    
    # 2. 启动 Ollama
    log_info "[2/3] 启动 Ollama..."
    if curl -s --max-time 2 "http://localhost:11434/" > /dev/null 2>&1; then
        log_success "Ollama 已在运行"
    else
        if command -v ollama &> /dev/null; then
            ollama serve &
            sleep 5
            log_success "Ollama 已启动"
        else
            log_error "Ollama 未安装"
            log_info "安装命令: curl -fsSL https://ollama.ai/install.sh | sh"
            exit 1
        fi
    fi
    echo ""
    
    # 3. 启动前端
    log_info "[3/3] 启动前端服务..."
    if curl -s --max-time 2 "http://localhost:1420" > /dev/null 2>&1; then
        log_success "前端服务已在运行"
    else
        if docker compose version &> /dev/null; then
            docker compose up -d aicatpin
        else
            log_warning "Docker Compose 未安装，尝试本地启动..."
            npm run dev &
        fi
        sleep 3
    fi
    echo ""
    
    # 更新环境变量
    log_info "更新环境变量..."
    local supabase_anon_key="your-anon-key"
    if command -v supabase &> /dev/null; then
        local key=$(supabase status 2>/dev/null | grep "Publishable" | awk -F'│' '{print $3}' | tr -d ' ')
        if [ -n "$key" ]; then
            supabase_anon_key="$key"
        fi
    fi
    
    cat > .env << EOF
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=$supabase_anon_key
VITE_OLLAMA_URL=http://localhost:11434
EOF
    
    log_success "环境变量已更新"
    echo ""
    
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                    所有服务已启动                          ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "服务地址:"
    echo -e "  • Supabase API:  http://localhost:54321"
    echo -e "  • Supabase UI:   http://localhost:54323"
    echo -e "  • Ollama:        http://localhost:11434"
    echo -e "  • 前端应用:      http://localhost:1420"
    echo ""
    echo -e "运行 '$0 test' 验证服务状态"
    echo ""
}

# 停止所有服务
cmd_stop() {
    echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║                    停止所有服务                           ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    log_info "停止 Supabase..."
    supabase stop 2>/dev/null || true
    
    log_info "停止 Ollama..."
    pkill ollama 2>/dev/null || true
    
    log_info "停止前端服务..."
    docker compose down 2>/dev/null || true
    
    log_success "所有服务已停止"
}

# 测试服务状态
cmd_test() {
    echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║                    测试服务状态                           ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    local passed=0
    local failed=0
    
    # 测试 Supabase
    echo -n "Supabase API: "
    if curl -s --max-time 5 "http://localhost:54321/health" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ 正常${NC}"
        passed=$((passed + 1))
    else
        echo -e "${RED}✗ 未运行${NC}"
        failed=$((failed + 1))
    fi
    
    # 测试 Ollama
    echo -n "Ollama API:   "
    if curl -s --max-time 5 "http://localhost:11434/" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ 正常${NC}"
        passed=$((passed + 1))
    else
        echo -e "${RED}✗ 未运行${NC}"
        failed=$((failed + 1))
    fi
    
    # 测试前端
    echo -n "前端应用:     "
    if curl -s --max-time 5 "http://localhost:1420" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ 正常${NC}"
        passed=$((passed + 1))
    else
        echo -e "${RED}✗ 未运行${NC}"
        failed=$((failed + 1))
    fi
    
    # 测试数据库
    echo -n "PostgreSQL:   "
    if psql postgresql://postgres:postgres@localhost:54322/postgres -c "SELECT 1" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ 正常${NC}"
        passed=$((passed + 1))
    else
        echo -e "${RED}✗ 未运行${NC}"
        failed=$((failed + 1))
    fi
    
    # 测试 AI 模型
    echo -n "AI 模型:      "
    if ollama list 2>/dev/null | grep -q "gemma4:e2b"; then
        echo -e "${GREEN}✓ 已加载${NC}"
        passed=$((passed + 1))
    else
        echo -e "${YELLOW}⚠ 未加载${NC}"
        failed=$((failed + 1))
    fi
    
    # 测试向量模型
    echo -n "向量模型:     "
    if ollama list 2>/dev/null | grep -q "nomic-embed-text"; then
        echo -e "${GREEN}✓ 已加载${NC}"
        passed=$((passed + 1))
    else
        echo -e "${YELLOW}⚠ 未加载${NC}"
        failed=$((failed + 1))
    fi
    
    echo ""
    echo -e "结果: ${GREEN}$passed 通过${NC} / ${RED}$failed 失败${NC}"
    echo ""
    
    if [ $failed -eq 0 ]; then
        echo -e "${GREEN}所有服务正常！可以测试保存功能。${NC}"
        echo ""
        echo -e "测试步骤:"
        echo -e "  1. 打开 http://localhost:1420"
        echo -e "  2. 输入内容"
        echo -e "  3. 按 Ctrl+S 保存"
        echo ""
    else
        echo -e "${YELLOW}部分服务未运行，请先运行: $0 start${NC}"
    fi
}

# 启动服务并测试
cmd_full() {
    cmd_start
    cmd_test
}

# 主函数
main() {
    case "${1:-help}" in
        init)
            cmd_init
            ;;
        start)
            cmd_start
            ;;
        stop)
            cmd_stop
            ;;
        test)
            cmd_test
            ;;
        full)
            cmd_full
            ;;
        help|*)
            show_help
            ;;
    esac
}

main "$@"