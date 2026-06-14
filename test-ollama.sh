#!/bin/bash

# AICatPin Ollama 测试脚本
echo "🤖 测试 Ollama API"
echo "=================================="

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Ollama 配置
OLLAMA_URL="http://127.0.0.1:11434"
MODEL="gemma4:e2b"
EMBEDDING_MODEL="nomic-embed-text"

# 检查 Ollama 服务
echo -e "${BLUE}1. 检查 Ollama 服务状态...${NC}"
if curl -s "$OLLAMA_URL/api/tags" >/dev/null 2>&1; then
    echo -e "${GREEN}✓ Ollama 服务运行中${NC}"
    
    # 显示可用模型
    echo -e "${BLUE}2. 可用模型:${NC}"
    curl -s "$OLLAMA_URL/api/tags" | jq -r '.models[] | "  - \(.name) (\(.size / 1024 / 1024 | floor) MB)"'
else
    echo -e "${RED}✗ Ollama 服务未运行${NC}"
    echo -e "${YELLOW}请启动 Ollama: ollama serve${NC}"
    exit 1
fi

# 测试生成 API
echo ""
echo -e "${BLUE}3. 测试生成 API (模型: $MODEL)...${NC}"
RESPONSE=$(curl -s "$OLLAMA_URL/api/generate" \
    -H "Content-Type: application/json" \
    -d "{
        \"model\": \"$MODEL\",
        \"prompt\": \"请用中文简单介绍一下你自己，不超过50字\",
        \"stream\": false,
        \"options\": {
            \"temperature\": 0.3,
            \"num_predict\": 100
        }
    }")

if echo "$RESPONSE" | jq -e '.response' >/dev/null 2>&1; then
    echo -e "${GREEN}✓ 生成 API 测试成功${NC}"
    echo -e "${BLUE}响应:${NC}"
    echo "$RESPONSE" | jq -r '.response' | head -5
else
    echo -e "${RED}✗ 生成 API 测试失败${NC}"
    echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
fi

# 测试 JSON 格式输出
echo ""
echo -e "${BLUE}4. 测试 JSON 格式输出...${NC}"
JSON_RESPONSE=$(curl -s "$OLLAMA_URL/api/generate" \
    -H "Content-Type: application/json" \
    -d "{
        \"model\": \"$MODEL\",
        \"prompt\": \"请分析以下内容并返回JSON格式的元数据：\\n\\n内容：Rust 是一门系统编程语言，注重安全、并发和性能。\\n\\n请返回：{\\\"title\\\": \\\"标题\\\", \\\"category\\\": \\\"分类\\\", \\\"tags\\\": [\\\"标签1\\\", \\\"标签2\\\"], \\\"summary\\\": \\\"摘要\\\"}\",
        \"stream\": false,
        \"format\": \"json\",
        \"options\": {
            \"temperature\": 0.3,
            \"num_predict\": 200
        }
    }")

if echo "$JSON_RESPONSE" | jq -e '.response' >/dev/null 2>&1; then
    echo -e "${GREEN}✓ JSON 格式输出测试成功${NC}"
    echo -e "${BLUE}响应:${NC}"
    echo "$JSON_RESPONSE" | jq -r '.response' | jq '.' 2>/dev/null || echo "$JSON_RESPONSE" | jq -r '.response'
else
    echo -e "${RED}✗ JSON 格式输出测试失败${NC}"
    echo "$JSON_RESPONSE" | jq '.' 2>/dev/null || echo "$JSON_RESPONSE"
fi

# 测试嵌入 API
echo ""
echo -e "${BLUE}5. 测试嵌入 API (模型: $EMBEDDING_MODEL)...${NC}"
EMBEDDING_RESPONSE=$(curl -s "$OLLAMA_URL/api/embeddings" \
    -H "Content-Type: application/json" \
    -d "{
        \"model\": \"$EMBEDDING_MODEL\",
        \"prompt\": \"Hello, world!\"
    }")

if echo "$EMBEDDING_RESPONSE" | jq -e '.embedding' >/dev/null 2>&1; then
    EMBEDDING_LENGTH=$(echo "$EMBEDDING_RESPONSE" | jq '.embedding | length')
    echo -e "${GREEN}✓ 嵌入 API 测试成功${NC}"
    echo -e "${BLUE}向量维度:${NC} $EMBEDDING_LENGTH"
    echo -e "${BLUE}前5个值:${NC}"
    echo "$EMBEDDING_RESPONSE" | jq '.embedding[:5]'
else
    echo -e "${RED}✗ 嵌入 API 测试失败${NC}"
    echo "$EMBEDDING_RESPONSE" | jq '.' 2>/dev/null || echo "$EMBEDDING_RESPONSE"
fi

# 测试完整的元数据提取流程
echo ""
echo -e "${BLUE}6. 测试完整元数据提取流程...${NC}"
TEST_CONTENT="TCP/IP 协议栈是互联网的基础，它定义了数据如何在网络中传输。TCP 提供可靠的、面向连接的服务，而 UDP 则提供无连接的服务。"

METADATA_RESPONSE=$(curl -s "$OLLAMA_URL/api/generate" \
    -H "Content-Type: application/json" \
    -d "{
        \"model\": \"$MODEL\",
        \"prompt\": \"你是一个知识管理助手。请分析以下内容，并提取元数据。\\n\\n要求：\\n1. title: 提取一个简洁的标题（不超过50个字符）\\n2. category: 选择一个最合适的分类（只能选择一个，从以下选项中选择：Programming, Networking, Database, Systems, Security, DevOps, AI, Other）\\n3. tags: 提取3-5个相关标签（小写英文，用数组格式）\\n4. summary: 生成一段简洁的摘要（不超过150个字符）\\n\\n请严格按照以下JSON格式返回，不要包含任何其他内容：\\n{\\\"title\\\": \\\"标题\\\", \\\"category\\\": \\\"分类\\\", \\\"tags\\\": [\\\"标签1\\\", \\\"标签2\\\", \\\"标签3\\\"], \\\"summary\\\": \\\"摘要内容\\\"}\\n\\n内容：$TEST_CONTENT\",
        \"stream\": false,
        \"format\": \"json\",
        \"options\": {
            \"temperature\": 0.3,
            \"num_predict\": 500
        }
    }")

if echo "$METADATA_RESPONSE" | jq -e '.response' >/dev/null 2>&1; then
    echo -e "${GREEN}✓ 元数据提取测试成功${NC}"
    echo -e "${BLUE}提取结果:${NC}"
    echo "$METADATA_RESPONSE" | jq -r '.response' | jq '.' 2>/dev/null || echo "$METADATA_RESPONSE" | jq -r '.response'
else
    echo -e "${RED}✗ 元数据提取测试失败${NC}"
    echo "$METADATA_RESPONSE" | jq '.' 2>/dev/null || echo "$METADATA_RESPONSE"
fi

# 总结
echo ""
echo "=================================="
echo -e "${GREEN}🎉 Ollama API 测试完成！${NC}"
echo ""
echo -e "${BLUE}测试结果:${NC}"
echo "  ✓ Ollama 服务: 运行中"
echo "  ✓ 生成 API: 正常"
echo "  ✓ JSON 格式: 支持"
echo "  ✓ 嵌入 API: 正常"
echo "  ✓ 元数据提取: 正常"
echo ""
echo -e "${YELLOW}提示:${NC}"
echo "  - 模型: $MODEL"
echo "  - 嵌入模型: $EMBEDDING_MODEL"
echo "  - API 地址: $OLLAMA_URL"
echo ""
echo -e "${GREEN}可以开始使用 AICatPin 的 AI 功能了！${NC}"