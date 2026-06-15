#!/bin/bash

# ============================================================
# AICatPin 服务启动脚本
# 用于快速启动本地开发环境
# ============================================================

set -e

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查命令是否存在
check_command() {
    if ! command -v "$1" &> /dev/null; then
        log_error "$1 未安装"
        return 1
    fi
    return 0
}

# 等待服务就绪
wait_for_service() {
    local url=$1
    local service_name=$2
    local max_attempts=30
    local attempt=1

    log_info "等待 $service_name 启动..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s "$url" > /dev/null 2>&1; then
            log_success "$service_name 已就绪"
            return 0
        fi
        
        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    echo ""
    log_error "$service_name 启动超时"
    return 1
}

# 主函数
main() {
    echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║              AICatPin 服务启动脚本                         ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""

    # 检查依赖
    log_info "检查依赖..."
    
    if ! check_command "docker"; then
        log_error "请先安装 Docker"
        exit 1
    fi
    
    if ! check_command "docker-compose" && ! docker compose version &> /dev/null; then
        log_error "请先安装 Docker Compose"
        exit 1
    fi
    
    if ! check_command "supabase"; then
        log_warning "Supabase CLI 未安装，尝试安装..."
        npm install -g supabase
        if [ $? -ne 0 ]; then
            log_error "Supabase CLI 安装失败"
            log_info "请手动安装: npm install -g supabase"
            exit 1
        fi
    fi
    
    if ! check_command "ollama"; then
        log_warning "Ollama 未安装"
        log_info "请访问 https://ollama.ai 安装 Ollama"
        exit 1
    fi
    
    log_success "依赖检查通过"
    echo ""

    # 启动 Supabase
    log_info "启动 Supabase..."
    
    if ! supabase status > /dev/null 2>&1; then
        log_info "初始化 Supabase..."
        supabase init --force 2>/dev/null || true
        
        log_info "启动 Supabase 服务..."
        supabase start
        
        if [ $? -ne 0 ]; then
            log_error "Supabase 启动失败"
            log_info "尝试手动运行: supabase start"
            exit 1
        fi
        
        log_info "运行数据库迁移..."
        supabase db reset
        
        if [ $? -ne 0 ]; then
            log_warning "数据库迁移失败，但服务已启动"
        fi
    else
        log_success "Supabase 已在运行"
    fi
    
    echo ""

    # 启动 Ollama
    log_info "启动 Ollama..."
    
    if ! pgrep -x "ollama" > /dev/null; then
        log_info "启动 Ollama 服务..."
        ollama serve &
        
        # 等待 Ollama 启动
        sleep 5
        
        if ! pgrep -x "ollama" > /dev/null; then
            log_error "Ollama 启动失败"
            log_info "尝试手动运行: ollama serve"
            exit 1
        fi
    else
        log_success "Ollama 已在运行"
    fi
    
    # 检查并下载模型
    log_info "检查 Ollama 模型..."
    
    if ! ollama list | grep -q "gemma4:e2b"; then
        log_info "下载 gemma4:e2b 模型..."
        ollama pull gemma4:e2b
        
        if [ $? -ne 0 ]; then
            log_warning "gemma4:e2b 模型下载失败，将使用默认模型"
        fi
    else
        log_success "gemma4:e2b 模型已存在"
    fi
    
    if ! ollama list | grep -q "nomic-embed-text"; then
        log_info "下载 nomic-embed-text 模型..."
        ollama pull nomic-embed-text
        
        if [ $? -ne 0 ]; then
            log_warning "nomic-embed-text 模型下载失败"
        fi
    else
        log_success "nomic-embed-text 模型已存在"
    fi
    
    echo ""

    # 更新环境变量
    log_info "更新环境变量..."
    
    # 获取 Supabase anon key
    SUPABASE_ANON_KEY=$(supabase status | grep "anon key" | awk '{print $NF}')
    
    if [ -z "$SUPABASE_ANON_KEY" ]; then
        log_warning "无法获取 Supabase anon key，使用默认值"
        SUPABASE_ANON_KEY="your-anon-key"
    fi
    
    # 更新 .env 文件
    cat > .env << EOF
# Supabase 配置（本地）
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY

# Ollama 配置
VITE_OLLAMA_URL=http://localhost:11434
EOF
    
    log_success "环境变量已更新"
    echo ""

    # 启动前端服务
    log_info "启动前端服务..."
    
    if docker compose ps | grep -q "aicatpin-frontend"; then
        log_info "重启前端服务..."
        docker compose restart aicatpin
    else
        log_info "启动前端服务..."
        docker compose up -d aicatpin
    fi
    
    if [ $? -ne 0 ]; then
        log_error "前端服务启动失败"
        log_info "尝试手动运行: docker compose up -d aicatpin"
        exit 1
    fi
    
    # 等待前端服务就绪
    wait_for_service "http://localhost:1420" "前端服务"
    
    echo ""

    # 显示服务状态
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                    服务启动完成                           ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${BLUE}服务状态:${NC}"
    echo -e "  ${GREEN}✓${NC} Supabase:  http://localhost:54321"
    echo -e "  ${GREEN}✓${NC} Ollama:     http://localhost:11434"
    echo -e "  ${GREEN}✓${NC} 前端应用:   http://localhost:1420"
    echo ""
    echo -e "${BLUE}快速链接:${NC}"
    echo -e "  应用:        http://localhost:1420"
    echo -e "  Supabase:    http://localhost:54323"
    echo -e "  Ollama:      http://localhost:11434"
    echo ""
    echo -e "${YELLOW}测试步骤:${NC}"
    echo -e "  1. 打开 http://localhost:1420"
    echo -e "  2. 输入内容，按 Ctrl+S 保存"
    echo -e "  3. 观察状态栏变化"
    echo ""
    echo -e "${BLUE}查看日志:${NC}"
    echo -e "  前端日志: docker compose logs -f aicatpin"
    echo -e "  Supabase: supabase logs"
    echo -e "  Ollama:   journalctl -u ollama -f"
    echo ""
    echo -e "${BLUE}停止服务:${NC}"
    echo -e "  supabase stop"
    echo -e "  pkill ollama"
    echo -e "  make stop"
    echo ""
}

# 运行主函数
main "$@"