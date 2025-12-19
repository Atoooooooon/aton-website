# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

全栈 CMS 系统,采用前后端分离架构:
- **后端**: Go + Gin + GORM + PostgreSQL + Redis
- **前端**: Next.js 14 + React 19 + TypeScript + Tailwind CSS
- **部署**: Docker Compose 容器化

核心功能: 照片上传、管理、发布和动态组件绑定。

## Essential Commands

### Docker 部署(推荐)
```bash
# 启动所有服务(Web + API + PostgreSQL + Redis)
docker compose up -d

# 查看日志
docker compose logs -f           # 所有服务
docker compose logs -f web       # 前端
docker compose logs -f api       # 后端

# 重启服务
docker compose restart
docker compose restart api       # 仅重启后端

# 重新构建
docker compose up -d --build
docker compose up -d --build api # 仅重构建后端

# 停止服务
docker compose down
docker compose down -v           # 删除数据卷
```

### 后端开发(Go)
```bash
cd api

# 运行
make run                        # 直接运行
make dev                        # 热重载(需要 air)

# 构建
make build                      # 输出到 bin/server

# 测试与代码质量
make test                       # 运行所有测试
make lint                       # 运行 linter(需要 golangci-lint)
make format                     # 格式化代码

# 依赖管理
go mod download                 # 下载依赖
go mod tidy                     # 清理依赖
```

### 前端开发(Next.js)
```bash
cd web

# 开发
npm install                     # 安装依赖
npm run dev                     # 开发服务器(http://localhost:3000)

# 构建与部署
npm run build                   # 生产构建
npm start                       # 启动生产服务器

# 代码质量
npm run lint                    # ESLint 检查
npm run format                  # Prettier 格式化
npm run format:check            # 检查格式
```

### 数据库管理
```bash
# 进入 PostgreSQL 容器
docker compose exec db psql -U webapp

# 查看日志
docker compose logs -f db
```

## Architecture

### 后端架构(Clean Architecture)

采用严格的分层设计,各层职责清晰:

```
api/
├── cmd/server/main.go              # 应用启动入口
├── internal/
│   ├── config/                     # 环境变量与配置加载
│   ├── server/                     # HTTP 服务器初始化、路由、中间件装配
│   ├── domain/                     # 核心实体(Photo, User, ComponentPhoto)
│   ├── delivery/http/
│   │   ├── handler/                # HTTP 处理器(PhotoHandler, AuthHandler)
│   │   └── middleware/             # 中间件(AuthMiddleware)
│   ├── usecase/                    # 业务逻辑层(PhotoService, AuthService)
│   ├── repository/                 # 数据访问层(PhotoRepository, UserRepository)
│   ├── infrastructure/jwt/         # JWT 认证基础设施
│   └── pkg/                        # 通用工具包
│       ├── apperror/               # 统一错误处理(AppError)
│       ├── response/               # 统一响应格式
│       └── logger/
```

**数据流向**:
```
HTTP Request → Middleware → Handler → UseCase → Repository → Database
                                         ↓
                                    AppError
                                         ↓
                                Response Handler
```

**关键约定**:
- Handler 只负责 HTTP 层面的请求解析与响应序列化
- UseCase 包含所有业务逻辑,不依赖 HTTP 概念
- Repository 接口在 domain 层定义,实现在 repository 层
- 所有错误通过 `apperror.AppError` 统一处理

### 前端架构(Next.js App Router)

```
web/
├── app/                          # Next.js 13+ App Router
│   ├── page.tsx                  # 首页(/)
│   ├── admin/                    # 管理后台(/admin/*)
│   │   ├── login/
│   │   ├── photos/
│   │   └── change-password/
│   ├── photos/page.tsx           # 公开照片墙(/photos)
│   └── api/proxy-image/route.ts  # API 路由
├── components/                   # React 组件
│   ├── admin/                    # 后台组件
│   ├── ui/                       # 基础 UI 组件
│   └── [业务组件].tsx
├── lib/                          # 工具库
│   ├── api/client.ts             # 统一 API 客户端
│   ├── config.ts                 # API 端点配置
│   ├── types/                    # TypeScript 类型定义
│   └── hooks/                    # 自定义 Hooks
```

**API 客户端设计**:
- `apiClient.get/post/put/delete<T>(url, requireAuth?)`
- `requireAuth=false`: 公开接口(如照片墙)
- `requireAuth=true`: 后台接口(自动附加 JWT token)
- Token 存储在 `localStorage.token`
- 统一错误处理: 抛出 `ApiError(message, status, url)`

### 认证流程

```
登录页 → POST /api/v1/auth/login → AuthService.Login()
                                       ↓
                              JWT Token(24小时有效)
                                       ↓
                          localStorage.setItem("token", token)
                                       ↓
           后续请求自动附加 Authorization: Bearer <token>
                                       ↓
                            AuthMiddleware 验证
```

### 核心数据模型

```go
// Photo - 照片主实体
type Photo struct {
    ID            uint
    Title         string
    Description   string
    ImageURL      string       // 原图 URL
    ThumbnailURL  string       // 缩略图 URL
    Category      string
    Location      string
    IsFeatured    bool         // 是否推荐
    DisplayOrder  int          // 排序字段
    Status        string       // "draft" | "published"
    CreatedAt     time.Time
    UpdatedAt     time.Time
}

// ComponentPhoto - 组件照片关联(中间表)
type ComponentPhoto struct {
    ID            uint
    ComponentName string       // 组件名称(如 "HeroSectionWithPhotos")
    PhotoID       uint         // 关联 Photo.ID
    Order         int          // 组件内排序
    Props         string       // JSON 字段(存储 caption, alt, link 等)
    CreatedAt     time.Time
    UpdatedAt     time.Time
}
```

**组件照片绑定机制**:
1. 管理员在后台为特定组件分配照片: `POST /api/v1/component-photos`
2. 前端页面渲染时动态加载: `GET /api/v1/components/:name/photos`
3. Props 字段允许为每张照片定制组件特定属性

## API Design Patterns

### 统一错误处理

**后端**:
```go
// 使用 apperror 构造错误
return apperror.NotFound(errors.New("photo not found"))
return apperror.BadRequest(errors.New("invalid request"))
return apperror.Unauthorized(errors.New("token expired"))

// Handler 层统一处理
if appErr, ok := apperror.IsAppError(err); ok {
    response.Error(c, appErr)
    return
}
```

**前端**:
```typescript
try {
    await apiClient.post(url, data);
} catch (error) {
    if (error instanceof ApiError) {
        console.error(`API Error [${error.status}]: ${error.message}`);
        // 根据 status 处理(401 跳转登录, 404 显示提示等)
    }
}
```

### 统一响应格式

**成功响应**:
```json
{
  "data": { ... }
}
```

**错误响应**:
```json
{
  "error": "error message"
}
```

## Environment Configuration

### 后端环境变量(api/.env)
```bash
# 服务配置
ENV=development
API_HOST=0.0.0.0
API_PORT=8080

# 数据库
POSTGRES_HOST=db
POSTGRES_PORT=5432
POSTGRES_USER=webapp
POSTGRES_PASSWORD=webapp
POSTGRES_DB=webapp
POSTGRES_SSL_MODE=disable

# Redis
REDIS_ADDR=redis:6379

# 认证
JWT_SECRET=your-secret-key

# CORS
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# 对象存储(MinIO/OSS)
OSS_ENDPOINT=
OSS_BUCKET=
OSS_ACCESS_KEY_ID=
OSS_ACCESS_KEY_SECRET=
OSS_USE_SSL=false
```

### 前端环境变量(web/.env)
```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
```

**注意**:
- Docker 部署时 API_BASE_URL 应指向容器内地址: `http://api:8080/api`
- 本地开发时指向 localhost: `http://localhost:8080`

## Key Technical Decisions

### 为什么使用 Clean Architecture?
- **可测试性**: 业务逻辑与 HTTP/数据库解耦,易于单元测试
- **可维护性**: 各层职责清晰,修改不会跨层蔓延
- **可替换性**: 数据库、框架可轻易替换

### 为什么使用 ComponentPhoto 中间表?
- **灵活性**: 同一张照片可用于多个组件,避免重复上传
- **解耦**: 照片管理与组件渲染逻辑分离
- **扩展性**: Props JSON 字段允许每个组件自定义属性

### JWT vs Session?
- **无状态**: 适合前后端分离架构
- **跨域友好**: 不依赖 Cookie
- **可扩展**: 支持多服务器部署

## Development Workflow

### 添加新的 API 端点

1. **定义 Domain 模型**(如需要): `api/internal/domain/your_entity.go`
2. **创建 Repository 接口**: 在 domain 层定义接口
3. **实现 Repository**: `api/internal/repository/your_repo.go`
4. **编写 UseCase**: `api/internal/usecase/your_service.go`
5. **创建 Handler**: `api/internal/delivery/http/handler/your_handler.go`
6. **注册路由**: 在 `api/internal/server/server.go` 中添加路由

### 添加新的前端页面

1. **创建页面**: `web/app/your-page/page.tsx`
2. **定义类型**: `web/lib/types/your-type.ts`
3. **添加 API 端点**: 在 `web/lib/config.ts` 中定义
4. **调用 API**: 使用 `apiClient.get/post/put/delete`
5. **错误处理**: 使用 try-catch 捕获 `ApiError`

### 添加新的 UI 组件

1. **创建组件**: `web/components/YourComponent.tsx`
2. **使用 Tailwind CSS**: 遵循现有样式规范
3. **类型定义**: 为 Props 定义 TypeScript 接口
4. **复用基础组件**: 优先使用 `components/ui/` 中的组件

## Common Pitfalls

### 后端

**❌ 错误**: 在 Handler 中直接调用 Repository
```go
// BAD
func (h *PhotoHandler) GetPhoto(c *gin.Context) {
    photo, err := h.photoRepo.FindByID(id)  // 跳过了业务逻辑层
}
```

**✅ 正确**: 通过 UseCase 调用
```go
// GOOD
func (h *PhotoHandler) GetPhoto(c *gin.Context) {
    photo, err := h.photoService.GetPhotoByID(c.Request.Context(), id)
}
```

**❌ 错误**: 返回原始 error
```go
// BAD
return c.JSON(500, gin.H{"error": err.Error()})
```

**✅ 正确**: 使用 apperror + response
```go
// GOOD
return apperror.InternalError(err)  // 自动隐藏内部错误细节
response.Error(c, err)
```

### 前端

**❌ 错误**: 硬编码 API URL
```typescript
// BAD
const response = await fetch("http://localhost:8080/api/v1/photos");
```

**✅ 正确**: 使用 config.ts + apiClient
```typescript
// GOOD
const photos = await apiClient.get<Photo[]>(API_ENDPOINTS.photosPublished, false);
```

**❌ 错误**: 忘记指定 requireAuth
```typescript
// BAD - 公开接口不应要求认证
await apiClient.get(API_ENDPOINTS.photosPublished);  // 默认 requireAuth=true
```

**✅ 正确**: 明确指定
```typescript
// GOOD
await apiClient.get(API_ENDPOINTS.photosPublished, false);  // 公开接口
await apiClient.get(API_ENDPOINTS.photos, true);            // 管理接口
```

## Service Ports

| 服务 | 端口 | 用途 |
|------|------|------|
| Next.js Web | 3000 | 前端应用 |
| Go API | 8080 | 后端 API |
| PostgreSQL | 5432 | 数据库 |
| Redis | 6379 | 缓存 |

## Project Status

**已实现**:
- ✅ 用户认证(JWT)
- ✅ 照片上传/管理/发布
- ✅ 组件照片动态绑定
- ✅ 管理后台
- ✅ 公开照片墙
- ✅ Docker 容器化部署

**待完善**:
- ⚠️ 单元测试覆盖
- ⚠️ API 文档(考虑 Swagger/OpenAPI)
- ⚠️ 数据库迁移脚本
- ⚠️ 前端全局状态管理(考虑 Zustand/Jotai)
