# AICatPin 快速参考卡

## 服务启动

### 首次运行（需要下载 Docker 镜像）
```bash
# 初始化 Supabase（约 5-10 分钟）
./setup-and-test.sh init
```

### 日常使用
```bash
# 启动所有服务
./setup-and-test.sh start

# 测试服务状态
./setup-and-test.sh test

# 启动服务并测试
./setup-and-test.sh full

# 停止所有服务
./setup-and-test.sh stop
```

### 手动启动
```bash
# 1. 启动 Supabase
supabase start

# 2. 启动 Ollama
ollama serve &

# 3. 启动前端
make dev
```

## 服务停止

```bash
# 停止所有服务
supabase stop
pkill ollama
make stop
```

## 服务状态检查

```bash
# 检查所有服务（仅检查，不启动）
./test-services.sh

# 完整测试（启动服务 + 运行测试）
./test-full.sh

# 检查单个服务
supabase status          # Supabase
ollama list              # Ollama 模型
docker compose ps        # 前端容器
```

## 常用命令

### Supabase
```bash
supabase start           # 启动服务
supabase stop            # 停止服务
supabase status          # 查看状态
supabase logs            # 查看日志
supabase db reset        # 重置数据库
supabase studio          # 打开管理界面
```

### Ollama
```bash
ollama serve             # 启动服务
ollama list              # 列出模型
ollama pull <model>      # 下载模型
ollama rm <model>        # 删除模型
ollama show <model>      # 查看模型信息
```

### Docker
```bash
make dev                 # 启动开发环境
make stop                # 停止所有服务
make restart             # 重启服务
make logs                # 查看日志
make shell               # 进入容器
```

### 数据库
```bash
# 连接数据库
psql postgresql://postgres:postgres@localhost:54322/postgres

# 常用查询
SELECT * FROM knowledge_vault LIMIT 10;
SELECT count(*) FROM knowledge_vault;
```

## 服务地址

| 服务 | 地址 | 说明 |
|------|------|------|
| 前端应用 | http://localhost:1420 | 主应用 |
| Supabase API | http://localhost:54321 | 数据库 API |
| Supabase Studio | http://localhost:54323 | 数据库管理 |
| 数据库 | localhost:54322 | PostgreSQL |
| Ollama | http://localhost:11434 | AI 服务 |

## 快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl+S` | 保存笔记 |
| `Ctrl+N` | 新建笔记 |
| `Ctrl+K` | 命令面板 |
| `Ctrl+Shift+A` | AI 面板 |

## 故障排除

### 服务无法启动
```bash
# 检查端口占用
lsof -i :54321
lsof -i :11434
lsof -i :1420

# 重启 Docker
sudo systemctl restart docker
```

### 保存失败
```bash
# 1. 检查服务状态
./test-services.sh

# 2. 查看错误日志
docker compose logs -f aicatpin

# 3. 检查环境变量
cat .env
```

### 数据库问题
```bash
# 重置数据库
supabase db reset

# 查看迁移状态
supabase migration list
```

### Ollama 问题
```bash
# 检查模型
ollama list

# 重新下载模型
ollama pull gemma4:e2b
ollama pull nomic-embed-text

# 查看 Ollama 日志
journalctl -u ollama -f
```

## 环境变量

```bash
# .env 文件内容
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=<your-anon-key>
VITE_OLLAMA_URL=http://localhost:11434
```

## 文件说明

| 文件 | 说明 |
|------|------|
| `start-services.sh` | 一键启动脚本 |
| `test-services.sh` | 服务测试脚本 |
| `TESTING_GUIDE.md` | 完整测试指南 |
| `QUICK_REFERENCE.md` | 快速参考卡 |
| `.env` | 环境变量配置 |

## 开发工作流

```bash
# 1. 启动服务
./start-services.sh

# 2. 开发功能
# 编辑代码，浏览器自动热重载

# 3. 测试功能
./test-services.sh

# 4. 提交代码
git add .
git commit -m "feat: 新功能"
git push
```

## 模型信息

| 模型 | 用途 | 大小 |
|------|------|------|
| gemma4:e2b | 元数据提取 | 7.2 GB |
| nomic-embed-text | 向量嵌入 | 274 MB |

## 性能优化

### 模型预加载
```bash
# 预加载模型（减少首次响应时间）
curl http://localhost:11434/api/generate \
  -H "Content-Type: application/json" \
  -d '{"model":"gemma4:e2b","prompt":"","stream":false}'
```

### 数据库索引
```sql
-- 查看索引
\d knowledge_vault

-- 创建向量索引（如果需要）
CREATE INDEX ON knowledge_vault USING hnsw (embedding vector_cosine_ops);
```

---

**最后更新**: 2026-06-14  
**版本**: 1.0.0