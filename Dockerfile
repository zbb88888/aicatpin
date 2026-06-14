# AICatPin Dockerfile
# 多阶段构建，优化镜像大小

# ============================================================
# 阶段 1: 构建前端
# ============================================================
FROM node:18-alpine AS frontend-builder

WORKDIR /app

# 安装依赖
COPY package.json package-lock.json ./
RUN npm ci --only=production

# 复制源代码
COPY . .

# 构建前端
RUN npm run build

# ============================================================
# 阶段 2: 生产镜像
# ============================================================
FROM node:18-alpine AS production

WORKDIR /app

# 安装生产依赖
COPY package.json package-lock.json ./
RUN npm ci --only=production && npm cache clean --force

# 复制构建产物
COPY --from=frontend-builder /app/dist ./dist

# 复制必要文件
COPY src-tauri ./src-tauri
COPY supabase ./supabase
COPY Makefile ./
COPY rerun.sh ./

# 暴露端口
EXPOSE 1420

# 启动命令
CMD ["npm", "run", "dev"]

# ============================================================
# 阶段 3: 开发镜像
# ============================================================
FROM node:18-alpine AS development

WORKDIR /app

# 安装依赖
COPY package.json package-lock.json ./
RUN npm install

# 复制源代码
COPY . .

# 暴露端口
EXPOSE 1420

# 启动命令
CMD ["npm", "run", "dev"]