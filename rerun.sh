#!/bin/bash

# AICatPin 重新运行脚本
echo "🔄 重新启动 AICatPin 开发服务器..."

# 停止现有的 vite 进程
echo "⏹️  停止现有进程..."
pkill -f "node.*vite" 2>/dev/null || true
sleep 1

# 启动开发服务器
echo "🚀 启动开发服务器..."
npm run dev