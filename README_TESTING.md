# AICatPin 测试流程

## 快速开始

### 首次运行（需要下载 Docker 镜像）

```bash
# 初始化 Supabase（首次需要，约 5-10 分钟）
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

## 命令说明

| 命令 | 说明 |
|------|------|
| `init` | 初始化 Supabase（首次运行，下载 Docker 镜像） |
| `start` | 启动所有服务（Supabase + Ollama + 前端） |
| `stop` | 停止所有服务 |
| `test` | 测试服务状态 |
| `full` | 启动服务并测试 |
| `help` | 显示帮助 |

## 测试保存功能

1. 启动服务：
   ```bash
   ./setup-and-test.sh start
   ```

2. 测试服务状态：
   ```bash
   ./setup-and-test.sh test
   ```

3. 打开浏览器访问 http://localhost:1420

4. 输入内容，按 `Ctrl+S` 保存

5. 观察状态栏变化：
   - `AI 重构中...` → `向量计算中...` → `保存中...` → `已保存`

## 故障排除

### Supabase 启动失败

```bash
# 查看日志
supabase logs

# 重置 Supabase
supabase stop
supabase start
```

### Ollama 模型未加载

```bash
# 下载模型
ollama pull gemma4:e2b
ollama pull nomic-embed-text
```

### 前端服务未启动

```bash
# 使用 Docker 启动
docker compose up -d aicatpin

# 或本地启动
npm run dev
```

## 服务地址

| 服务 | 地址 |
|------|------|
| 前端应用 | http://localhost:1420 |
| Supabase API | http://localhost:54321 |
| Supabase Studio | http://localhost:54323 |
| PostgreSQL | localhost:54322 |
| Ollama | http://localhost:11434 |

## 相关文档

- `TESTING_GUIDE.md` - 完整测试指南
- `QUICK_REFERENCE.md` - 快速参考卡
- `UPGRADE_SUMMARY.md` - 版本升级记录