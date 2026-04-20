# Pomodoro MVP

一个简洁的番茄钟应用，采用前后端分离架构。

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 18 + Vite + useReducer |
| 后端 | Go + Gin + Viper |

## 项目结构

```
pomodoro-mvp/
├── README.md
├── docker-compose.yml
├── server/                    # Go 后端
│   ├── cmd/server/           # 入口
│   │   └── main.go
│   ├── config.yaml           # 配置文件
│   ├── internal/
│   │   ├── config/          # 配置管理
│   │   │   └── config.go
│   │   ├── handler/         # HTTP 处理层
│   │   │   └── pomodoro.go
│   │   ├── middleware/      # 中间件
│   │   │   └── cors.go
│   │   ├── model/           # 数据模型
│   │   │   └── state.go
│   │   └── service/         # 业务逻辑
│   │       ├── timer.go
│   │       ├── timer_interface.go
│   │       └── timer_test.go
│   ├── Dockerfile
│   ├── go.mod
│   └── go.sum
└── web/                      # React 前端
    ├── src/
    │   ├── api/             # API 调用
    │   │   └── pomodoro.js
    │   ├── components/      # UI 组件
    │   │   ├── ActionButtons.jsx
    │   │   ├── ConfigPanel.jsx
    │   │   ├── Message.jsx
    │   │   └── Timer.jsx
    │   ├── hooks/           # 自定义 Hooks
    │   │   └── usePomodoro.js
    │   ├── App.jsx          # 主组件
    │   ├── main.jsx         # 入口
    │   └── styles.css       # 样式
    ├── .env.example         # 环境变量示例
    ├── .gitignore
    ├── Dockerfile
    ├── nginx.conf           # Nginx 配置
    ├── index.html
    ├── package.json
    └── vite.config.js
```

## 快速开始

### 前置要求

- Go 1.25+
- Node.js 18+

### 1. 启动后端

```bash
cd server
go run ./cmd/server
```

服务启动后访问 http://localhost:8080

### 2. 启动前端

```bash
cd web
npm install
npm run dev
```

前端运行在 http://localhost:5173

### 3. 使用 Docker Compose

```bash
docker-compose up -d
```

## API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/pomodoro` | 获取番茄钟状态 |
| POST | `/api/pomodoro/start` | 开始计时 |
| POST | `/api/pomodoro/pause` | 暂停 |
| POST | `/api/pomodoro/resume` | 继续 |
| POST | `/api/pomodoro/reset` | 重置 |
| POST | `/api/pomodoro/skip` | 跳过当前阶段 |
| PUT | `/api/pomodoro/durations` | 更新设置 |

### 配置示例

```bash
# 更新专注时长
curl -X PUT http://localhost:8080/api/pomodoro/durations \
  -H "Content-Type: application/json" \
  -d '{"focusMinutes": 30, "breakMinutes": 10}'
```

## 配置

后端配置文件位于 `server/config.yaml`：

```yaml
server:
  port: "8080"
  readTimeout: 5
  writeTimeout: 5
log:
  level: "info"
```

环境变量覆盖：
- `POMODORO_SERVER_PORT` 或 `PORT` - 服务端口
- `POMODORO_SERVER_READTIMEOUT` - 读取超时（秒）
- `POMODORO_SERVER_WRITETIMEOUT` - 写入超时（秒）

前端环境变量：
- `VITE_API_BASE_URL` - API 基础路径

## 测试

```bash
cd server
go test ./internal/service/... -v
```

## 代码优化记录

### v1.1.0 (2026-04-20)

1. **前端状态管理重构** - 使用 `useReducer` 替代多个 `useState`
2. **API 统一错误处理** - 封装统一的 API 客户端
3. **后端接口抽象** - 定义 `Timer` 接口便于测试
4. **配置管理增强** - 支持环境变量覆盖和更多配置项
5. **前端组件拆分** - 拆分为多个可复用组件

## 许可

MIT
