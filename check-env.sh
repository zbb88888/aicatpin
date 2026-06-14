#!/bin/bash

# AICatPin 环境检查脚本
echo "🔍 检查 AICatPin 开发环境..."
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查函数
check_command() {
    if command -v $1 &> /dev/null; then
        echo -e "${GREEN}✅ $1 已安装${NC} - $(command $1 --version 2>/dev/null || echo '版本未知')"
        return 0
    else
        echo -e "${RED}❌ $1 未安装${NC}"
        return 1
    fi
}

check_port() {
    if command -v nc &> /dev/null; then
        if nc -z localhost $1 2>/dev/null; then
            echo -e "${GREEN}✅ 端口 $1 正在监听${NC}"
            return 0
        else
            echo -e "${YELLOW}⚠️  端口 $1 未监听${NC}"
            return 1
        fi
    elif command -v curl &> /dev/null; then
        if curl -s http://localhost:$1 > /dev/null 2>&1; then
            echo -e "${GREEN}✅ 端口 $1 正在监听${NC}"
            return 0
        else
            echo -e "${YELLOW}⚠️  端口 $1 未监听${NC}"
            return 1
        fi
    else
        echo -e "${YELLOW}⚠️  无法检查端口 $1 (需要 nc 或 curl)${NC}"
        return 1
    fi
}

# 检查必需工具
echo "📦 检查必需工具:"
check_command node
check_command npm
check_command rustc
check_command cargo

echo ""
echo "🔧 检查可选工具:"
check_command supabase
check_command ollama

echo ""
echo "🌐 检查服务状态:"
check_port 54321  # Supabase
check_port 11434  # Ollama
check_port 5432   # PostgreSQL

echo ""
echo "📁 检查项目文件:"
if [ -f "package.json" ]; then
    echo -e "${GREEN}✅ package.json 存在${NC}"
else
    echo -e "${RED}❌ package.json 不存在${NC}"
fi

if [ -f ".env" ]; then
    echo -e "${GREEN}✅ .env 文件存在${NC}"
else
    echo -e "${YELLOW}⚠️  .env 文件不存在${NC}"
fi

if [ -f ".pi/prompts/project.md" ]; then
    echo -e "${GREEN}✅ pi 提示词已配置${NC}"
else
    echo -e "${YELLOW}⚠️  pi 提示词未配置${NC}"
fi

echo ""
echo "📋 环境检查完成！"
echo ""

# 提供下一步建议
echo "🚀 下一步操作:"
echo "1. 如果缺少依赖，请安装它们"
echo "2. 运行 'npm install' 安装项目依赖"
echo "3. 配置 .env 文件"
echo "4. 启动 Supabase: supabase start"
echo "5. 启动 Ollama: ollama serve"
echo "6. 开始开发: npm run tauri dev"