#!/bin/bash

set -e

echo "🍅 启动 Pomodoro MVP 项目..."

# 检查 Node.js 是否安装
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未找到 Node.js，请先安装 Node.js"
    exit 1
fi

# 检查 Go 是否安装
if ! command -v go &> /dev/null; then
    echo "❌ 错误: 未找到 Go，请先安装 Go"
    exit 1
fi

# 启动后端服务
echo "🚀 启动后端服务..."
cd server
go run ./cmd/server &
SERVER_PID=$!
cd ..

# 等待后端启动
sleep 2

# 启动前端服务
echo "🎨 启动前端服务..."
cd web
npm run dev &
WEB_PID=$!
cd ..

echo ""
echo "✅ 项目启动完成！"
echo ""
echo "📡 服务地址:"
echo "   后端 API: http://localhost:8080"
echo "   前端页面: http://localhost:5173"
echo ""
echo "按 Ctrl+C 停止所有服务"

# 等待用户中断
trap "echo ''; echo '🛑 正在停止服务...'; kill $SERVER_PID $WEB_PID 2>/dev/null; exit 0" INT

wait