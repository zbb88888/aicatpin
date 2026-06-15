#!/bin/bash

# ============================================================
# AICatPin 服务测试脚本
# 用于验证所有服务是否正常运行
# ============================================================

set -e

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 测试结果
TESTS_PASSED=0
TESTS_FAILED=0

# 测试函数
test_service() {
    local service_name=$1
    local url=$2
    local description=$3
    
    echo -n "测试 $service_name... "
    
    if curl -s --max-time 5 "$url" > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} $description"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        return 0
    else
        echo -e "${RED}✗${NC} $description"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
}

# 主测试函数
main() {
    echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║              AICatPin 服务测试                             ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""

    # 测试 Supabase
    echo -e "${BLUE}1. 测试 Supabase 服务${NC}"
    test_service "Supabase API" "http://localhost:54321/health" "API 服务正常"
    test_service "Supabase Studio" "http://localhost:54323" "管理界面正常"
    echo ""

    # 测试 Ollama
    echo -e "${BLUE}2. 测试 Ollama 服务${NC}"
    test_service "Ollama API" "http://localhost:11434/" "API 服务正常"
    
    # 测试 Ollama 模型
    echo -n "测试 Ollama 模型... "
    if ollama list | grep -q "gemma4:e2b"; then
        echo -e "${GREEN}✓${NC} gemma4:e2b 模型已加载"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "${RED}✗${NC} gemma4:e2b 模型未找到"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
    
    echo -n "测试嵌入模型... "
    if ollama list | grep -q "nomic-embed-text"; then
        echo -e "${GREEN}✓${NC} nomic-embed-text 模型已加载"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "${RED}✗${NC} nomic-embed-text 模型未找到"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
    echo ""

    # 测试前端服务
    echo -e "${BLUE}3. 测试前端服务${NC}"
    test_service "前端应用" "http://localhost:1420" "前端服务正常"
    echo ""

    # 测试数据库连接
    echo -e "${BLUE}4. 测试数据库连接${NC}"
    echo -n "测试数据库连接... "
    if psql postgresql://postgres:postgres@localhost:54322/postgres -c "SELECT 1" > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} 数据库连接正常"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "${RED}✗${NC} 数据库连接失败"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
    
    # 测试表是否存在
    echo -n "测试数据表... "
    if psql postgresql://postgres:postgres@localhost:54322/postgres -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'knowledge_vault')" | grep -q "t"; then
        echo -e "${GREEN}✓${NC} knowledge_vault 表存在"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "${YELLOW}⚠${NC} knowledge_vault 表不存在（需要运行迁移）"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
    echo ""

    # 测试环境变量
    echo -e "${BLUE}5. 测试环境变量${NC}"
    echo -n "测试 .env 文件... "
    if [ -f ".env" ]; then
        echo -e "${GREEN}✓${NC} .env 文件存在"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        
        # 检查环境变量内容
        if grep -q "VITE_SUPABASE_URL" .env && grep -q "VITE_OLLAMA_URL" .env; then
            echo -e "${GREEN}✓${NC} 环境变量配置完整"
            TESTS_PASSED=$((TESTS_PASSED + 1))
        else
            echo -e "${RED}✗${NC} 环境变量配置不完整"
            TESTS_FAILED=$((TESTS_FAILED + 1))
        fi
    else
        echo -e "${RED}✗${NC} .env 文件不存在"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
    echo ""

    # 测试 AI 功能（可选）
    echo -e "${BLUE}6. 测试 AI 功能${NC}"
    echo -n "测试元数据提取... "
    
    # 使用 curl 测试 Ollama API
    RESPONSE=$(curl -s --max-time 10 http://localhost:11434/api/generate \
        -H "Content-Type: application/json" \
        -d '{
            "model": "gemma4:e2b",
            "prompt": "测试",
            "stream": false,
            "options": { "num_predict": 10 }
        }' 2>/dev/null)
    
    if echo "$RESPONSE" | grep -q "response"; then
        echo -e "${GREEN}✓${NC} AI 模型响应正常"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "${RED}✗${NC} AI 模型响应失败"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
    
    echo -n "测试向量嵌入... "
    
    RESPONSE=$(curl -s --max-time 10 http://localhost:11434/api/embeddings \
        -H "Content-Type: application/json" \
        -d '{
            "model": "nomic-embed-text",
            "prompt": "测试"
        }' 2>/dev/null)
    
    if echo "$RESPONSE" | grep -q "embedding"; then
        echo -e "${GREEN}✓${NC} 向量嵌入功能正常"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "${RED}✗${NC} 向量嵌入功能失败"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
    echo ""

    # 显示测试结果
    echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║                    测试结果                               ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "测试通过: ${GREEN}$TESTS_PASSED${NC}"
    echo -e "测试失败: ${RED}$TESTS_FAILED${NC}"
    echo ""
    
    if [ $TESTS_FAILED -eq 0 ]; then
        echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
        echo -e "${GREEN}║                    所有测试通过！                          ║${NC}"
        echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
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
        echo -e "  1. 检查服务是否启动: supabase status"
        echo -e "  2. 检查 Ollama: ollama list"
        echo -e "  3. 查看日志: supabase logs"
        echo -e "  4. 参考 TESTING_GUIDE.md"
        echo ""
        return 1
    fi
}

# 运行主函数
main "$@"