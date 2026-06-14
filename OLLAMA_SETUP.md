# Ollama 配置指南

## 概述

AICatPin 使用 Ollama 作为本地 AI 引擎，支持内容生成、元数据提取和向量嵌入。

## 模型配置

### 当前配置

| 用途 | 模型 | 大小 | 说明 |
|------|------|------|------|
| 内容生成 | gemma4:e2b | 7.2 GB | 主要 AI 模型，用于元数据提取和内容生成 |
| 向量嵌入 | nomic-embed-text | ~274 MB | 用于生成 1024 维向量嵌入 |

### 安装模型

```bash
# 下载所有必需模型
make ollama-pull

# 或者单独下载
ollama pull gemma4:e2b      # 主模型
ollama pull nomic-embed-text  # 嵌入模型
```

## API 端点

### 1. 生成 API

**端点:** `POST http://127.0.0.1:11434/api/generate`

**用途:** 生成文本、提取元数据

**示例:**
```bash
curl http://127.0.0.1:11434/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gemma4:e2b",
    "prompt": "请提取标题、分类、标签和摘要",
    "stream": false,
    "format": "json"
  }'
```

### 2. 嵌入 API

**端点:** `POST http://127.0.0.1:11434/api/embeddings`

**用途:** 生成向量嵌入

**示例:**
```bash
curl http://127.0.0.1:11434/api/embeddings \
  -H "Content-Type: application/json" \
  -d '{
    "model": "nomic-embed-text",
    "prompt": "Hello, world!"
  }'
```

## 测试 Ollama

### 运行测试脚本

```bash
# 运行 Ollama 测试
./test-ollama.sh

# 或者使用 Makefile
make ollama-test
```

### 手动测试

```bash
# 检查服务状态
curl http://127.0.0.1:11434/api/tags

# 测试生成
curl http://127.0.0.1:11434/api/generate \
  -H "Content-Type: application/json" \
  -d '{"model":"gemma4:e2b","prompt":"Hello","stream":false}'

# 测试嵌入
curl http://127.0.0.1:11434/api/embeddings \
  -H "Content-Type: application/json" \
  -d '{"model":"nomic-embed-text","prompt":"Hello"}'
```

## 元数据提取

AICatPin 使用 gemma4:e2b 模型提取以下元数据：

### 提取的字段

1. **title** - 标题（不超过 50 字符）
2. **category** - 分类（从预定义选项中选择）
3. **tags** - 标签数组（3-5 个）
4. **summary** - 摘要（不超过 150 字符）

### 预定义分类

- Programming
- Networking
- Database
- Systems
- Security
- DevOps
- AI
- Other

### 提示词模板

```
你是一个知识管理助手。请分析以下内容，并提取元数据。

要求：
1. title: 提取一个简洁的标题（不超过50个字符）
2. category: 选择一个最合适的分类（只能选择一个，从以下选项中选择：Programming, Networking, Database, Systems, Security, DevOps, AI, Other）
3. tags: 提取3-5个相关标签（小写英文，用数组格式）
4. summary: 生成一段简洁的摘要（不超过150个字符）

请严格按照以下JSON格式返回，不要包含任何其他内容：
{
  "title": "标题",
  "category": "分类",
  "tags": ["标签1", "标签2", "标签3"],
  "summary": "摘要内容"
}

内容：
{content}
```

## 向量嵌入

AICatPin 使用 nomic-embed-text 模型生成向量嵌入：

### 配置

- **模型:** nomic-embed-text
- **维度:** 1024
- **用途:** 语义搜索

### 使用方式

1. 将标题、摘要和内容前 500 字符组合
2. 调用嵌入 API 生成向量
3. 将向量存储到 PostgreSQL 的 `embedding` 字段
4. 使用 HNSW 索引进行相似度搜索

## 性能优化

### 模型加载

```bash
# 预加载模型（减少首次响应时间）
curl http://127.0.0.1:11434/api/generate \
  -H "Content-Type: application/json" \
  -d '{"model":"gemma4:e2b","prompt":"","stream":false}'
```

### 参数调优

```json
{
  "options": {
    "temperature": 0.3,      // 降低随机性
    "num_predict": 500,      // 限制输出长度
    "top_p": 0.9,           // 核采样
    "top_k": 40             // Top-K 采样
  }
}
```

## 故障排除

### 1. Ollama 服务未运行

```bash
# 启动 Ollama
ollama serve

# 或者使用 Makefile
make ollama-start
```

### 2. 模型未找到

```bash
# 下载模型
ollama pull gemma4:e2b
ollama pull nomic-embed-text

# 或者使用 Makefile
make ollama-pull
```

### 3. 内存不足

```bash
# 查看模型大小
ollama ls

# 使用更小的模型（如果需要）
ollama pull gemma:2b
```

### 4. API 响应慢

```bash
# 检查系统资源
htop

# 减少并发请求
# 在代码中添加请求队列
```

## 监控

### 查看模型状态

```bash
# 列出所有模型
ollama ls

# 查看模型详情
ollama show gemma4:e2b
```

### 查看 API 日志

```bash
# 查看 Ollama 日志
journalctl -u ollama -f

# 或者查看系统日志
tail -f /var/log/syslog | grep ollama
```

## 最佳实践

1. **模型选择:** 根据任务复杂度选择合适的模型
2. **参数调优:** 根据需求调整 temperature 和 num_predict
3. **错误处理:** 实现重试机制和降级策略
4. **缓存:** 缓存常用查询的结果
5. **监控:** 监控 API 响应时间和错误率

## 相关命令

```bash
# Makefile 命令
make ollama-start    # 启动 Ollama
make ollama-pull     # 下载模型
make ollama-status   # 查看状态
make ollama-test     # 测试 API

# 测试脚本
./test-ollama.sh     # 运行完整测试
```

## 相关文件

- `src/hooks/useCatPinSave.ts` - 保存 Hook（使用 Ollama API）
- `test-ollama.sh` - Ollama 测试脚本
- `Makefile` - 构建系统（包含 Ollama 命令）

---

**最后更新:** 2024-01-02  
**模型版本:** gemma4:e2b, nomic-embed-text