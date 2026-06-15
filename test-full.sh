#!/bin/bash

# ============================================================
# AICatPin 完整测试脚本
# 自动启动所有服务并运行测试
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

# 等待服务就绪
wait_for_service() {
    local url=$1
    local service_name=$2
    local max_attempts=30
    local attempt=1

    log_info "等待 $service_name 启动..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s --max-time 2 "$url" > /dev/null 2>&1; then
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

# 启动 Supabase
start_supabase() {
    log_info "检查 Supabase 状态..."
    
    if curl -s --max-time 2 "http://localhost:54321/health" > /dev/null 2>&1; then
        log_success "Supabase 已在运行"
        return 0
    fi
    
    log_info "启动 Supabase..."
    
    # 检查 supabase CLI
    if ! command -v supabase &> /dev/null; then
        log_error "Supabase CLI 未安装"
        log_info "安装命令: npm install -g supabase"
        return 1
    fi
    
    # 初始化（如果需要）
    if [ ! -f "supabase/config.toml" ]; then
        log_info "初始化 Supabase..."
        supabase init --force 2>/dev/null || true
    fi
    
    # 启动服务
    supabase start
    
    if [ $? -ne 0 ]; then
        log_error "Supabase 启动失败"
        return 1
    fi
    
    # 等待服务就绪
    wait_for_service "http://localhost:54321/health" "Supabase API"
    
    # 运行迁移
    log_info "运行数据库迁移..."
    supabase db reset 2>/dev/null || supabase migration up 2>/dev/null || true
    
    return 0
}

# 启动 Ollama
start_ollama() {
    log_info "检查 Ollama 状态..."
    
    if curl -s --max-time 2 "http://localhost:11434/" > /dev/null 2>&1; then
        log_success "Ollama 已在运行"
    else
        log_info "启动 Ollama..."
        
        # 检查 ollama CLI
        if ! command -v ollama &> /dev/null; then
            log_error "Ollama 未安装"
            log_info "安装命令: curl -fsSL https://ollama.ai/install.sh | sh"
            return 1
        fi
        
        # 启动服务
        ollama serve &
        
        # 等待服务就绪
        sleep 5
        wait_for_service "http://localhost:11434/" "Ollama API"
    fi
    
    # 检查模型
    log_info "检查 Ollama 模型..."
    
    if ! ollama list | grep -q "gemma4:e2b"; then
        log_warning "gemma4:e2b 模型未找到，开始下载..."
        ollama pull gemma4:e2b
    else
        log_success "gemma4:e2b 模型已存在"
    fi
    
    if ! ollama list | grep -q "nomic-embed-text"; then
        log_warning "nomic-embed-text 模型未找到，开始下载..."
        ollama pull nomic-embed-text
    else
        log_success "nomic-embed-text 模型已存在"
    fi
    
    return 0
}

# 启动前端服务
start_frontend() {
    log_info "检查前端服务状态..."
    
    if curl -s --max-time 2 "http://localhost:1420" > /dev/null 2>&1; then
        log_success "前端服务已在运行"
        return 0
    fi
    
    log_info "启动前端服务..."
    
    # 使用 docker compose 启动
    if command -v docker &> /dev/null && docker compose version &> /dev/null; then
        docker compose up -d aicatpin
        wait_for_service "http://localhost:1420" "前端服务"
    else
        log_warning "Docker 未安装，尝试本地启动..."
        npm run dev &
        wait_for_service "http://localhost:1420" "前端服务"
    fi
    
    return 0
}

# 更新环境变量
update_env() {
    log_info "更新环境变量..."
    
    # 获取 Supabase anon key
    local supabase_anon_key="your-anon-key"
    
    if command -v supabase &> /dev/null; then
        local key=$(supabase status 2>/dev/null | grep "anon key" | awk '{print $NF}')
        if [ -n "$key" ]; then
            supabase_anon_key="$key"
        fi
    fi
    
    # 更新 .env 文件
    cat > .env << EOF
# Supabase 配置（本地）
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=$supabase_anon_key

# Ollama 配置
VITE_OLLAMA_URL=http://localhost:11434
EOF
    
    log_success "环境变量已更新"
}

# 运行测试
run_tests() {
    echo ""
    echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║                    运行功能测试                           ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    local tests_passed=0
    local tests_failed=0
    
    # 测试 Supabase API
    echo -n "测试 Supabase API... "
    if curl -s --max-time 5 "http://localhost:54321/health" > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC}"
        tests_passed=$((tests_passed + 1))
    else
        echo -e "${RED}✗${NC}"
        tests_failed=$((tests_failed + 1))
    fi
    
    # 测试 Ollama API
    echo -n "测试 Ollama API... "
    if curl -s --max-time 5 "http://localhost:11434/" > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC}"
        tests_passed=$((tests_passed + 1))
    else
        echo -e "${RED}✗${NC}"
        tests_failed=$((tests_failed + 1))
    fi
    
    # 测试前端服务
    echo -n "测试前端服务... "
    if curl -s --max-time 5 "http://localhost:1420" > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC}"
        tests_passed=$((tests_passed + 1))
    else
        echo -e "${RED}✗${NC}"
        tests_failed=$((tests_failed + 1))
    fi
    
    # 测试数据库连接
    echo -n "测试数据库连接... "
    if psql postgresql://postgres:postgres@localhost:54322/postgres -c "SELECT 1" > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC}"
        tests_passed=$((tests_passed + 1))
    else
        echo -e "${RED}✗${NC}"
        tests_failed=$((tests_failed + 1))
    fi
    
    # 测试 AI 功能
    echo -n "测试 AI 元数据提取... "
    local response=$(curl -s --max-time 10 http://localhost:11434/api/generate \
        -H "Content-Type: application/json" \
        -d '{
            "model": "gemma4:e2b",
            "prompt": "测试",
            "stream": false,
            "options": { "num_predict": 10 }
        }' 2>/dev/null)
    
    if echo "$response" | grep -q "response"; then
        echo -e "${GREEN}✓${NC}"
        tests_passed=$((tests_passed + 1))
    else
        echo -e "${RED}✗${NC}"
        tests_failed=$((tests_failed + 1))
    fi
    
    # 测试向量嵌入
    echo -n "测试向量嵌入... "
    response=$(curl -s --max-time 10 http://localhost:11434/api/embeddings \
        -H "Content-Type: application/json" \
        -d '{
            "model": "nomic-embed-text",
            "prompt": "测试"
        }' 2>/dev/null)
    
    if echo "$response" | grep -q "embedding"; then
        echo -e "${GREEN}✓${NC}"
        tests_passed=$((tests_passed + 1))
    else
        echo -e "${RED}✗${NC}"
        tests_failed=$((tests_failed + 1))
    fi
    
    echo ""
    echo -e "测试结果: ${GREEN}$tests_passed 通过${NC} / ${RED}$tests_failed 失败${NC}"
    echo ""
    
    if [ $tests_failed -eq 0 ]; then
        return 0
    else
        return 1
    fi
}

# 主函数
main() {
    echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║         AICatPin 完整测试流程                             ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    # 1. 启动 Supabase
    echo -e "${BLUE}[步骤 1/4] 启动 Supabase${NC}"
    if ! start_supabase; then
        log_error "Supabase 启动失败"
        exit 1
    fi
    echo ""
    
    # 2. 启动 Ollama
    echo -e "${BLUE}[步骤 2/4] 启动 Ollama${NC}"
    if ! start_ollama; then
        log_error "Ollama 启动失败"
        exit 1
    fi
    echo ""
    
    # 3. 更新环境变量
    echo -e "${BLUE}[步骤 3/4] 配置环境变量${NC}"
    update_env
    echo ""
    
    # 4. 启动前端服务
    echo -e "${BLUE}[步骤 4/4] 启动前端服务${NC}"
    if ! start_frontend; then
        log_error "前端服务启动失败"
        exit 1
    fi
    echo ""
    
    # 5. 运行测试
    echo -e "${BLUE}[步骤 5/5] 运行功能测试${NC}"
    if run_tests; then
        echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
        echo -e "${GREEN}║                    所有测试通过！                          ║${NC}"
        echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
        echo ""
        echo -e "${BLUE}服务状态:${NC}"
        echo -e "  ✓ Supabase:  http://localhost:54321"
        echo -e "  ✓ Ollama:    http://localhost:11434"
        echo -e "  ✓ 前端应用:  http://localhost:1420"
        echo ""
        echo -e "${BLUE}下一步:${NC}"
        echo -e "  1. 打开 http://localhost:1420"
        echo -e "  2. 输入内容，按 Ctrl+S 测试保存功能"
        echo -e "  3. 观察状态栏变化"
        echo ""
        return 0
    else
        echo -e "${YELLOW}╔════════════════════════════════════════════════════════════╗${NC}"
        echo -e "${YELLOW}║                    部分测试失败                           ║${NC}"
        echo -e "${YELLOW}╚════════════════════════════════════════════════════════════╝${NC}"
        echo ""
        echo -e "${BLUE}故障排除:${NC}"
        echo -e "  1. 查看日志: supabase logs"
        echo -e "  2. 检查 Ollama: ollama list"
        echo -e "  3. 参考 TESTING_GUIDE.md"
        echo ""
        return 1
    fi
}

# 运行主函数
main "$@"