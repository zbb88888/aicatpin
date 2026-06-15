# AICatPin 本地开发测试指南

## 概述

本文档记录 AICatPin 项目的完整本地开发测试流程，包括环境准备、服务启动、功能测试和故障排除。

## 前置要求

### 系统要求
- Node.js 24+
- Docker & Docker Compose
- 至少 8GB RAM（用于 Ollama 模型）

### 服务依赖
- **Supabase**：本地 PostgreSQL 数据库
- **Ollama**：本地 AI 服务（元数据提取 + 向量嵌入）
- **Vite**：前端开发服务器

---

## 第一步：环境准备

### 1.1 一键启动（推荐）

```bash
# 自动启动所有服务并运行测试
./test-full.sh
```

### 1.2 手动安装

#### 安装 Supabase CLI

```bash
# macOS/Linux
npm install -g supabase

# 验证安装
supabase --version
```

#### 安装 Ollama

```bash
# macOS/Linux
curl -fsSL https://ollama.ai/install.sh | sh

# 或者使用包管理器
# macOS: brew install ollama
# Ubuntu: sudo apt install ollama

# 验证安装
ollama --version
```

#### 启动 Ollama 服务

```bash
# 启动 Ollama 后台服务
ollama serve &

# 或者使用 systemd（Linux）
# sudo systemctl start ollama
# sudo systemctl enable ollama
```

#### 下载 AI 模型

```bash
# 下载主模型（用于元数据提取）
ollama pull gemma4:e2b

# 下载嵌入模型（用于向量生成）
ollama pull nomic-embed-text

# 验证模型下载
ollama ls
```

---

## 第二步：初始化 Supabase

### 2.1 初始化项目

```bash
cd /root/f/aicatpin

# 初始化 Supabase（如果还没有初始化）
supabase init

# 这会创建 supabase/config.toml 配置文件
```

### 2.2 启动本地 Supabase

```bash
# 启动所有 Supabase 服务
supabase start

# 首次启动会下载 Docker 镜像，可能需要几分钟
# 启动后会显示：
# - API URL: http://localhost:54321
# - Studio URL: http://localhost:54323
# - DB URL: postgresql://postgres:postgres@localhost:54322/postgres
```

### 2.3 运行数据库迁移

```bash
# 重置数据库并运行迁移
supabase db reset

# 或者手动运行迁移
supabase migration up
```

### 2.4 验证数据库

```bash
# 检查数据库连接
supabase status

# 或者使用 psql 连接
psql postgresql://postgres:postgres@localhost:54322/postgres
```

---

## 第三步：配置环境变量

### 3.1 更新 .env 文件

```bash
# 编辑 .env 文件
cat > .env << EOF
# Supabase 配置（本地）
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=your-anon-key

# Ollama 配置
VITE_OLLAMA_URL=http://localhost:11434
EOF
```

### 3.2 获取 Supabase Anon Key

```bash
# 从 Supabase 获取 anon key
supabase status | grep "anon key"

# 或者查看 supabase/config.toml
cat supabase/config.toml | grep anon_key
```

### 3.3 更新 .env 文件（带真实 key）

```bash
# 使用获取到的 anon key
cat > .env << EOF
# Supabase 配置（本地）
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Ollama 配置
VITE_OLLAMA_URL=http://localhost:11434
EOF
```

---

## 第四步：启动前端服务

### 4.1 使用 Docker（推荐）

```bash
# 启动前端开发服务器
make dev

# 或者直接使用 docker compose
docker compose up -d aicatpin

# 查看日志
docker compose logs -f aicatpin
```

### 4.2 本地启动（不使用 Docker）

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 访问 http://localhost:1420
```

---

## 第五步：功能测试

### 5.1 基础功能测试

1. **访问应用**
   - 打开浏览器：http://localhost:1420
   - 确认页面正常加载

2. **编辑器测试**
   - 在标题栏输入主题
   - 在编辑器中输入内容
   - 测试格式化功能（标题、列表、代码块等）

3. **快捷键测试**
   - `Ctrl+K`：打开命令面板
   - `Ctrl+N`：新建笔记
   - `Ctrl+S`：保存笔记
   - `Ctrl+Shift+A`：打开 AI 面板

### 5.2 保存功能测试

1. **输入测试内容**
   ```
   测试标题：TCP/IP 协议详解
   
   TCP/IP 是互联网的基础协议，定义了数据如何在网络中传输。
   ```

2. **触发保存**
   - 按 `Ctrl+S`
   - 观察底部状态栏变化

3. **预期状态流程**
   ```
   AI 重构中... → 向量计算中... → 保存中... → 已保存
   ```

4. **验证保存成功**
   - 状态栏显示 "已保存"
   - 无错误提示

### 5.3 错误处理测试

1. **停止 Ollama 服务**
   ```bash
   # 停止 Ollama
   pkill ollama
   ```

2. **测试保存**
   - 输入内容，按 `Ctrl+S`
   - 观察错误提示

3. **预期行为**
   - 显示错误提示："保存失败"
   - 提示启动服务的方法
   - 点击关闭按钮可关闭提示

4. **恢复服务**
   ```bash
   # 重新启动 Ollama
   ollama serve &
   ```

---

## 第六步：数据验证

### 6.1 查看数据库数据

```bash
# 连接到数据库
psql postgresql://postgres:postgres@localhost:54322/postgres

# 查询保存的笔记
SELECT id, title, category, tags, summary, created_at 
FROM knowledge_vault 
ORDER BY created_at DESC 
LIMIT 10;

# 退出
\q
```

### 6.2 使用 Supabase Studio

1. 打开 Supabase Studio：http://localhost:54323
2. 进入 Table Editor
3. 查看 `knowledge_vault` 表
4. 验证数据完整性

### 6.3 验证向量嵌入

```sql
-- 检查向量字段
SELECT id, title, embedding[1:5] as first_5_dims 
FROM knowledge_vault 
WHERE embedding IS NOT NULL 
LIMIT 5;
```

---

## 第七步：性能测试

### 7.1 保存性能测试

1. **测试不同大小的内容**
   - 短文本（<100字）
   - 中等文本（100-500字）
   - 长文本（>500字）

2. **记录保存时间**
   - AI 处理时间
   - 向量生成时间
   - 数据库存储时间

### 7.2 并发测试

```bash
# 使用多个浏览器标签页同时保存
# 观察是否有冲突或错误
```

---

## 故障排除

### 问题1：Supabase 启动失败

```bash
# 检查 Docker 状态
docker ps

# 查看 Supabase 日志
supabase logs

# 重置 Supabase
supabase stop
supabase start
```

### 问题2：Ollama 模型下载失败

```bash
# 检查网络连接
curl -I https://ollama.ai

# 使用代理（如果需要）
export HTTPS_PROXY=http://proxy:port
ollama pull gemma4:e2b

# 使用更小的模型
ollama pull gemma:2b
```

### 问题3：前端连接失败

```bash
# 检查环境变量
cat .env

# 验证服务可达
curl http://localhost:54321/health
curl http://localhost:11434/

# 重启前端服务
docker compose restart aicatpin
```

### 问题4：保存失败但无错误提示

```bash
# 查看浏览器控制台
# F12 → Console → 查看错误信息

# 查看网络请求
# F12 → Network → 查看失败的请求

# 查看前端日志
docker compose logs -f aicatpin
```

### 问题5：数据库迁移失败

```bash
# 重置数据库
supabase db reset

# 手动运行迁移
supabase migration up

# 查看迁移状态
supabase migration list
```

---

## 快速命令参考

### 服务管理

```bash
# 启动所有服务
supabase start
ollama serve &
make dev

# 停止所有服务
supabase stop
pkill ollama
make stop

# 查看状态
supabase status
ollama list
make status
```

### 日志查看

```bash
# Supabase 日志
supabase logs

# Ollama 日志
journalctl -u ollama -f

# 前端日志
docker compose logs -f aicatpin
```

### 数据库操作

```bash
# 连接数据库
psql postgresql://postgres:postgres@localhost:54322/postgres

# 备份数据
pg_dump -h localhost -p 54322 -U postgres postgres > backup.sql

# 恢复数据
psql -h localhost -p 54322 -U postgres postgres < backup.sql
```

---

## 开发工作流

### 日常开发流程

```bash
# 1. 启动服务
supabase start
ollama serve &

# 2. 启动前端
make dev

# 3. 开发功能
# 编辑代码，浏览器自动热重载

# 4. 测试功能
# 在浏览器中测试

# 5. 提交代码
git add .
git commit -m "feat: 添加新功能"
git push
```

### 测试新功能

```bash
# 1. 创建测试分支
git checkout -b test/new-feature

# 2. 实现功能
# 编辑代码

# 3. 测试
# 按照本文档测试流程

# 4. 合并
git checkout main
git merge test/new-feature
```

---

## 常见问题解答

### Q1: 需要多少磁盘空间？
A: 
- Supabase Docker 镜像：~2GB
- Ollama 模型：~8GB（gemma4:e2b + nomic-embed-text）
- 总计：~10GB

### Q2: 可以使用更小的模型吗？
A: 可以，修改 `src/hooks/useCatPinSave.ts`：
```typescript
const OLLAMA_MODEL = 'gemma:2b'  // 更小的模型
```

### Q3: 如何重置所有数据？
A:
```bash
# 停止服务
supabase stop
pkill ollama

# 删除数据
rm -rf supabase/.temp
rm -rf ~/.ollama

# 重新开始
supabase start
ollama pull gemma4:e2b
```

### Q4: 如何备份配置？
A:
```bash
# 备份环境变量
cp .env .env.backup

# 备份数据库
pg_dump -h localhost -p 54322 -U postgres postgres > backup.sql

# 备份 Ollama 模型（可选）
# 模型会自动下载，无需备份
```

---

## 最后更新

- 文档版本：1.0.0
- 更新日期：2026-06-14
- 适用版本：AICatPin v0.1.0