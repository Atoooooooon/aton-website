# atonWeb 开发与部署指南

本指南面向第一次接触本项目的开发者，覆盖项目结构、前后端开发规范、日常工作流以及本地/生产部署流程。所有命令均在 Linux 或 macOS 终端中执行，Windows 请在 WSL 中操作。

---

## 1. 项目结构速览

```
atonWeb/
├── api/                  # Go + Gin 后端服务
│   ├── cmd/server        # main 入口，仅做启动与关停控制
│   ├── internal/config   # 配置加载与环境变量助手
│   ├── internal/handlers # 业务路由与控制器
│   └── internal/server   # Gin 初始化、路由装配、中间件
├── web/                  # Next.js 14 + TS + Tailwind 前端
│   ├── src/app           # App Router，页面/布局/全局样式
│   ├── public            # 静态资源
│   ├── next.config.ts    # Next.js 配置
│   └── tsconfig.json     # TypeScript 配置
├── docker-compose.yml    # 一键启动 api + web + Postgres + Redis
└── DEV_GUIDE.md          # 本指南
```

> 小贴士：所有容器镜像、环境变量、端口映射都集中在 `docker-compose.yml` 中维护，务必保持与代码同步。

---

## 2. 共用开发规范

1. **Git 工作流**：
   - 新功能：`feature/<short-description>`，修复：`fix/<issue>`。
   - 提交前运行所有测试/构建命令，保持提交原子化。
2. **代码格式**：Go 使用 `gofmt`；前端由 ESLint/Prettier（随 Next 内置）接管。
3. **依赖管理**：
   - 后端：`go get` 新依赖后务必 `go mod tidy`。
   - 前端：统一使用 `npm`（已生成 `package-lock.json`）。
4. **环境变量**：默认值写在 `config.Load()`（后端）与 `.env.local`/`docker-compose.yml`（前端）中；生产环境切勿将真实密钥写入仓库。
5. **日志与监控**：后端用 `log/slog`；前端调试信息写入浏览器控制台但不要在生产中暴露敏感数据。
6. **测试基线**：
   - 后端：为每个 handler/服务编写 `*_test.go`，使用标准库 `testing` + `testify`。
   - 前端：暂未引入测试框架，可后续加 Playwright 或 Jest + Testing Library。

---

## 3. 后端（Go + Gin）规范

### 3.1 运行与热重载
```bash
cd api
go test ./...
go run ./cmd/server
```
如需热重载，可安装 [air](https://github.com/cosmtrek/air)（可选）。

### 3.2 目录职责
- `cmd/server/main.go`：解析配置、启动 HTTP 服务、处理优雅关停。
- `internal/server/server.go`：集中添加中间件与所有路由分组，禁止在 handler 中创建新 `gin.Engine`。
- `internal/handlers`：按领域拆分文件（示例：`health.go`）。对外暴露 `RegisterXxxRoutes` 函数。
- `internal/config`：只负责读取/拼装配置，禁止夹带业务逻辑。

### 3.3 编码约定
1. 每个 handler 接口：
   - 入参结构体放在 `request.go`，出参结构体放在 `response.go`（可按需要创建）。
   - 统一返回 `gin.H` 或定义好的 DTO，错误使用 `c.JSON(status, gin.H{"error": err.Error()})`。
2. 中间件放在 `internal/server/middleware`（创建后记得在 `server.go` 注册）。
3. 数据库访问：
   - 通过环境变量获取 DSN（已在 `config.Load()` 组装）。
   - 推荐使用 `database/sql` + `sqlc` 或 `gorm`（待后续添加，记得更新规范）。
4. Redis：在 `internal/pkg/cache`（自建目录）内包装客户端，暴露接口以便测试 mock。
5. 单元测试：
   - `go test ./...` 必须通过。
   - 使用 `t.Run` 分组，保证测试可读性。

---

## 4. 前端（Next.js + Tailwind）规范

### 4.1 本地运行
```bash
cd web
npm install        # 首次或依赖更新后
npm run dev        # 默认 http://localhost:3000
```

### 4.2 代码组织
1. **App Router**：所有页面放在 `src/app/<route>/page.tsx`，共享 UI 写在 `components/`（需要新建）。
2. **样式**：优先使用 Tailwind 原子类，公用样式写入 `globals.css` 或自定义 CSS module。
3. **TypeScript**：开启严格模式（Next 默认）。禁止使用 `any`，如必须则在注释中解释原因。
4. **数据请求**：
   - 服务端组件中使用 `fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/...`)`。
   - 客户端组件统一封装于 `/lib/api.ts`（需手动创建）以复用错误处理与类型。
5. **State 管理**：优先使用 React 内建 hook；复杂场景再引入 Zustand/Redux，新增依赖需评估 bundle 体积。
6. **Lint/格式化**：`npm run lint` 必须通过，VSCode 建议安装 ESLint/Tailwind 插件。

---

## 5. 推荐开发流程

1. `git pull` → `git checkout -b feature/<topic>`。
2. 修改后端/前端代码，随时运行：
   - 后端：`go test ./...`
   - 前端：`npm run lint`、`npm run build`
3. 如需端到端验证，执行 `docker compose up --build`（见下一节）。
4. 提交前确认：
   - 无多余 `print/log`。
   - `.env.local`、密钥文件未提交。
   - `git status` 干净。

---

## 6. 本地一键启动（Docker Compose）

### 6.1 先决条件
- 安装 Docker Engine + Docker Compose Plugin。
- 确保 3000、8080、5432、6379 端口空闲。

### 6.2 启动步骤
```bash
cd /home/aton/IdeaProjects/atonWeb
docker compose up --build
```
- `api`：监听 `http://localhost:8080`。
- `web`：监听 `http://localhost:3000`（内部通过服务名访问 API）。
- `db`：Postgres，默认库/用户/密码均为 `webapp`。
- `redis`：默认配置，数据保存到 Docker volume。

### 6.3 停止与清理
```bash
docker compose down          # 停止并保留数据
docker compose down -v      # 停止并删除 Postgres/Redis 数据卷
```

### 6.4 常见问题
1. **端口占用**：用 `lsof -i :3000` 找出进程并关闭。
2. **依赖下载很慢**：配置国内镜像源或使用公司私有代理。
3. **环境变量变更未生效**：重新 `docker compose up --build`，确保 `.env` 已被引用。

---

## 7. 生产部署指南

### 7.1 准备
1. 服务器（Linux x86_64，≥2C4G，20GB+ 存储）。
2. Docker/Docker Compose 已安装。
3. 准备好域名与 SSL（可使用 Nginx/Traefik 反向代理，本指南聚焦服务本身）。
4. 设置安全环境变量（可通过 `.env.production` + `docker compose --env-file`）。

### 7.2 构建镜像
```bash
git clone <repo>
cd atonWeb
docker compose build
```
构建后可执行 `docker compose push` 将镜像推送到私有仓库（可选）。

### 7.3 生产配置示例
新建 `env/production.env`：
```
API_PORT=8080
POSTGRES_HOST=db
POSTGRES_USER=prod_user
POSTGRES_PASSWORD=<strong-password>
POSTGRES_DB=prod_db
NEXT_PUBLIC_API_BASE_URL=https://api.example.com/api
```
运行：
```bash
docker compose --env-file env/production.env up -d
```

### 7.4 数据库与缓存
- **Postgres**：首部署时自动创建库/表，可配合迁移工具（待集成，如 Atlas/Goose）。
- **Redis**：`redis_data` 卷存储 RDB，生产中建议挂载到独立磁盘并设置持久化策略。

### 7.5 健康检查
- API：`GET https://api.example.com/api/healthz` 返回 `{ "status": "ok" }` 则正常。
- Web：访问 `https://example.com` 并检查浏览器控制台无错误。

### 7.6 日志与监控
- `docker compose logs -f api` 查看后端日志。
- 推荐在宿主机安装 Prometheus + Grafana 或使用托管解决方案，后端可暴露 `/metrics`（需后续实现）。

---

## 8. 进一步扩展建议
1. **后端**：加入数据库层（repository/service）、统一错误中间件、OpenAPI 文档。
2. **前端**：搭建 UI 组件库、引入查询缓存（SWR/React Query）。
3. **CI/CD**：GitHub Actions 构建与推送镜像，再由服务器 `docker compose pull && up -d`。
4. **安全**：启用 HTTPS、配置 CORS、数据库最小权限、为 Redis 加密码。

遵循以上规范可以保证团队协作顺畅、环境一致且部署可复现。如需新增流程，请同步更新本指南。
