# 为什么需要启动服务？

## 问题分析

当您按下 `Ctrl+S` 保存时，出现错误：
```
Supabase 错误: TypeError: Failed to fetch
```

这是因为 **Supabase 服务未运行**。

## 保存流程

```
Ctrl+S → 前端 → Supabase API → PostgreSQL 数据库
                ↓
            Ollama API → AI 处理
```

### 需要的服务

1. **Supabase** (http://localhost:54321)
   - 提供 REST API
   - 连接 PostgreSQL 数据库
   - 处理数据存储

2. **Ollama** (http://localhost:11434)
   - 本地 AI 服务
   - 提取元数据（标题、分类、标签）
   - 生成向量嵌入

3. **前端服务** (http://localhost:1420)
   - 用户界面
   - 编辑器功能

## 解决方案

### 方案 1：使用测试脚本（推荐）

```bash
# 首次运行（下载 Docker 镜像，约 5-10 分钟）
./setup-and-test.sh init

# 日常使用
./setup-and-test.sh start
./setup-and-test.sh test
```

### 方案 2：手动启动

```bash
# 1. 启动 Supabase
supabase start

# 2. 启动 Ollama
ollama serve &

# 3. 启动前端
docker compose up -d aicatpin
# 或
npm run dev
```

### 方案 3：使用远程 Supabase（无需本地 Docker）

更新 `.env` 文件：
```env
# 使用远程 Supabase（需要注册 https://supabase.com）
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-real-anon-key

# Ollama 保持本地
VITE_OLLAMA_URL=http://localhost:11434
```

## 验证服务

```bash
# 测试 Supabase
curl http://localhost:54321/health

# 测试 Ollama
curl http://localhost:11434/

# 测试前端
curl http://localhost:1420
```

## 常见问题

### Q: 为什么需要 Docker？
A: Supabase 使用 Docker 容器运行 PostgreSQL、PostgREST、GoTrue 等服务。

### Q: 下载镜像太慢怎么办？
A: 可以使用镜像源：
```bash
# 设置 Docker 镜像源
sudo mkdir -p /etc/docker
sudo tee /etc/docker/daemon.json <<-'EOF'
{
  "registry-mirrors": ["https://docker.mirrors.ustc.edu.cn"]
}
EOF
sudo systemctl restart docker
```

### Q: 可以不用 Supabase 吗？
A: 可以使用远程 Supabase 服务，见方案 3。

### Q: Ollama 模型下载失败？
A: 尝试使用更小的模型：
```bash
ollama pull gemma:2b
```
然后修改 `src/hooks/useCatPinSave.ts`：
```typescript
const OLLAMA_MODEL = 'gemma:2b'
```