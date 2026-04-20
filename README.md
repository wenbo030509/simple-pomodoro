# Pomodoro MVP

一个简洁的番茄钟应用，采用前后端分离架构。

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 18 + Vite |
| 后端 | Go + Gin |
| 配置 | Viper |

## 项目结构

```
pomodoro-mvp/
├── server/                    # Go 后端
│   ├── cmd/server/           # 入口
│   ├── internal/
│   │   ├── config/          # 配置管理
│   │   ├── handler/         # HTTP 处理层
│   │   ├── middleware/      # 中间件
│   │   ├── model/           # 数据模型
│   │   └── service/         # 业务逻辑
│   └── config.yaml          # 配置文件
│
└── web/                      # React 前端
    └── src/
        ├── api/             # API 调用
        ├── App.jsx          # 主组件
        └── styles.css       # 样式
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
```

## 测试

```bash
cd server
go test ./internal/service/... -v
```

## 许可

MIT
