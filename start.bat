@echo off
chcp 65001 >nul

echo 🍅 启动 Pomodoro MVP 项目...

REM 检查 Node.js 是否安装
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 错误: 未找到 Node.js，请先安装 Node.js
    pause
    exit /b 1
)

REM 检查 Go 是否安装
go version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 错误: 未找到 Go，请先安装 Go
    pause
    exit /b 1
)

echo 🚀 启动后端服务...
start "Backend" cmd /k "cd server && go run ./cmd/server"

REM 等待后端启动
timeout /t 2 /nobreak >nul

echo 🎨 启动前端服务...
start "Frontend" cmd /k "cd web && npm run dev"

echo.
echo ✅ 项目启动完成！
echo.
echo 📡 服务地址:
echo    后端 API: http://localhost:8080
echo    前端页面: http://localhost:5173
echo.
echo 按任意键退出...
pause >nul