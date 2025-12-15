# atonWeb

一些有趣的工具

## 快速启动

```bash
# 启动所有服务
docker compose up -d

# 查看服务状态
docker compose ps

# 查看日志
docker compose logs -f        # 所有服务
docker compose logs -f web    # 仅前端
docker compose logs -f api    # 仅后端
```

## 服务访问

| 服务 | 地址 | 说明 |
|------|------|------|
| 前端 Web | http://localhost:3000 | Next.js 应用 |
| 后端 API | http://localhost:8080 | Go 服务 |
| 数据库 | localhost:5432 | PostgreSQL |
| 缓存 | localhost:6379 | Redis |

## 常用命令

```bash
# 停止服务
docker compose down

# 停止并删除数据卷
docker compose down -v

# 重启服务
docker compose restart
docker compose restart web    # 仅重启前端
docker compose restart api    # 仅重启后端

# 重新构建并启动
docker compose up -d --build
docker compose up -d --build web    # 仅重新构建前端

# 查看实时日志
docker compose logs -f
docker compose logs -f web    # 仅查看前端日志

# 进入容器
docker compose exec web sh    # 前端容器
docker compose exec api sh    # 后端容器
docker compose exec db psql -U webapp  # 数据库
```

## 开发模式

```bash
# 前端开发
cd web
npm install
npm run dev

# 后端开发
cd api
go mod download
go run cmd/server/main.go
```

## 项目结构

```
.
├── web/          # Next.js 前端
├── api/          # Go 后端
├── docker-compose.yml
└── README.md
```
