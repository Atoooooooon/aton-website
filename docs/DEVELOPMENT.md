# Development Guide

## 开发环境设置

### 前置要求

- Go 1.21+
- PostgreSQL 14+
- MinIO (用于对象存储)
- Node.js 18+ (前端开发)

### 环境变量配置

创建 `.env` 文件:

```bash
cp .env.example .env
```

编辑 `.env`:

```env
# Server Configuration
SERVER_HOST=0.0.0.0
SERVER_PORT=8080
GIN_MODE=debug

# Database Configuration
POSTGRES_DSN=postgresql://aton:yourpassword@localhost:5432/aton_cms?sslmode=disable

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# MinIO Configuration
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=photos
MINIO_USE_SSL=false
```

### 启动数据库

使用 Docker 快速启动 PostgreSQL 和 MinIO:

```bash
# PostgreSQL
docker run --name postgres-aton \
  -e POSTGRES_USER=aton \
  -e POSTGRES_PASSWORD=yourpassword \
  -e POSTGRES_DB=aton_cms \
  -p 5432:5432 \
  -d postgres:14

# MinIO
docker run --name minio-aton \
  -p 9000:9000 \
  -p 9001:9001 \
  -e MINIO_ROOT_USER=minioadmin \
  -e MINIO_ROOT_PASSWORD=minioadmin \
  -d minio/minio server /data --console-address ":9001"
```

## 项目命令

使用 Makefile 提供的快捷命令:

```bash
# 查看所有可用命令
make help

# 运行服务器
make run

# 构建二进制文件
make build

# 运行测试
make test

# 清理构建产物
make clean

# 代码格式化
make format

# 运行 linter
make lint

# 开发模式 (热重载,需要安装 air)
make dev
```

## 开发工作流

### 1. 启动开发环境

```bash
# 终端 1: 启动后端服务
cd api
make run

# 终端 2: 启动前端服务
cd web
npm run dev
```

### 2. 创建初始管理员用户

```bash
curl -X POST http://localhost:8080/api/v1/auth/create-user \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123",
    "email": "admin@example.com"
  }'
```

### 3. 登录获取 Token

```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'
```

返回:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

### 4. 使用 Token 访问受保护的 API

```bash
TOKEN="your-jwt-token-here"

# 获取照片列表
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8080/api/v1/photos

# 上传照片 (获取上传令牌)
curl -X POST http://localhost:8080/api/v1/storage/upload-token \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "filename": "photo.jpg",
    "contentType": "image/jpeg"
  }'
```

## 代码规范

### Go 代码规范

遵循 [Effective Go](https://go.dev/doc/effective_go) 和本项目的架构原则:

#### 1. 命名规范

```go
// ✅ 好的命名
type PhotoService interface {...}
func NewPhotoService() PhotoService {...}
var ErrPhotoNotFound = errors.New("photo not found")

// ❌ 不好的命名
type photoservice interface {...}
func createPhotoService() photoservice {...}
var photoNotFound = errors.New("photo not found")
```

#### 2. 错误处理

```go
// ✅ 好的错误处理
photo, err := service.GetByID(id)
if err != nil {
    if err == usecase.ErrPhotoNotFound {
        response.NotFound(c, "Photo not found")
        return
    }
    response.InternalError(c, "Failed to get photo")
    return
}

// ❌ 不好的错误处理
photo, _ := service.GetByID(id)  // 忽略错误
```

#### 3. 依赖注入

```go
// ✅ 好的依赖注入
type PhotoHandler struct {
    service usecase.PhotoService
}

func NewPhotoHandler(service usecase.PhotoService) *PhotoHandler {
    return &PhotoHandler{service: service}
}

// ❌ 不好的依赖注入
type PhotoHandler struct {}

func (h *PhotoHandler) Create(c *gin.Context) {
    service := usecase.NewPhotoService(...)  // 在handler中创建依赖
}
```

#### 4. 接口定义

```go
// ✅ 好的接口定义 (小而专注)
type PhotoService interface {
    Create(req *CreatePhotoRequest) (*domain.Photo, error)
    GetByID(id uint) (*domain.Photo, error)
    Update(id uint, req *UpdatePhotoRequest) (*domain.Photo, error)
    Delete(id uint) error
}

// ❌ 不好的接口定义 (太大)
type PhotoService interface {
    Create(req *CreatePhotoRequest) (*domain.Photo, error)
    GetByID(id uint) (*domain.Photo, error)
    Update(id uint, req *UpdatePhotoRequest) (*domain.Photo, error)
    Delete(id uint) error
    SendEmail(to string) error  // 不相关的方法
    ProcessImage(data []byte) error  // 不相关的方法
}
```

### 项目特定规范

#### 1. 分层规则

```go
// ✅ Handler 只处理 HTTP
func (h *PhotoHandler) Create(c *gin.Context) {
    var req domain.CreatePhotoRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        response.BadRequest(c, err.Error())
        return
    }

    photo, err := h.service.Create(&req)
    if err != nil {
        // 错误处理...
    }

    response.Created(c, photo)
}

// ❌ Handler 不应该包含业务逻辑
func (h *PhotoHandler) Create(c *gin.Context) {
    var req domain.CreatePhotoRequest
    c.ShouldBindJSON(&req)

    // ❌ 业务逻辑应该在 usecase 层
    if req.Title == "" {
        response.BadRequest(c, "title required")
        return
    }

    // ❌ 直接访问数据库应该在 repository 层
    db.Create(&domain.Photo{Title: req.Title})
}
```

#### 2. 错误返回

```go
// ✅ 使用预定义的错误
var (
    ErrPhotoNotFound = &errors.AppError{
        Code: 404,
        Message: "Photo not found",
    }
)

func (s *photoService) GetByID(id uint) (*domain.Photo, error) {
    photo, err := s.repo.GetByID(id)
    if err != nil {
        return nil, ErrPhotoNotFound
    }
    return photo, nil
}

// ❌ 返回裸字符串错误
func (s *photoService) GetByID(id uint) (*domain.Photo, error) {
    photo, err := s.repo.GetByID(id)
    if err != nil {
        return nil, errors.New("not found")  // 缺少上下文
    }
    return photo, nil
}
```

## 测试

### 运行测试

```bash
# 运行所有测试
make test

# 运行特定包的测试
go test ./internal/usecase/...

# 运行测试并显示覆盖率
go test -cover ./...

# 生成覆盖率报告
go test -coverprofile=coverage.out ./...
go tool cover -html=coverage.out
```

### 编写测试

#### 单元测试示例

```go
// internal/usecase/photo_service_test.go
package usecase_test

import (
    "testing"
    "github.com/stretchr/testify/assert"
    "github.com/stretchr/testify/mock"
)

type MockPhotoRepository struct {
    mock.Mock
}

func (m *MockPhotoRepository) Create(photo *domain.Photo) error {
    args := m.Called(photo)
    return args.Error(0)
}

func TestPhotoService_Create(t *testing.T) {
    // Arrange
    mockRepo := new(MockPhotoRepository)
    service := usecase.NewPhotoService(mockRepo)

    req := &domain.CreatePhotoRequest{
        Title: "Test Photo",
        ImageURL: "https://example.com/photo.jpg",
    }

    mockRepo.On("Create", mock.AnythingOfType("*domain.Photo")).Return(nil)

    // Act
    photo, err := service.Create(req)

    // Assert
    assert.NoError(t, err)
    assert.NotNil(t, photo)
    assert.Equal(t, "Test Photo", photo.Title)
    mockRepo.AssertExpectations(t)
}
```

#### 集成测试示例

```go
// internal/delivery/http/handler/photo_test.go
package handler_test

import (
    "bytes"
    "encoding/json"
    "net/http/httptest"
    "testing"

    "github.com/gin-gonic/gin"
    "github.com/stretchr/testify/assert"
)

func TestPhotoHandler_Create(t *testing.T) {
    // Setup
    gin.SetMode(gin.TestMode)
    router := gin.New()

    // 这里需要设置完整的依赖注入链
    // db, repo, service, handler

    // Test request
    reqBody := map[string]interface{}{
        "title": "Test Photo",
        "imageUrl": "https://example.com/photo.jpg",
    }
    body, _ := json.Marshal(reqBody)

    req := httptest.NewRequest("POST", "/api/v1/photos", bytes.NewBuffer(body))
    req.Header.Set("Content-Type", "application/json")
    req.Header.Set("Authorization", "Bearer "+testToken)

    w := httptest.NewRecorder()
    router.ServeHTTP(w, req)

    // Assert
    assert.Equal(t, 201, w.Code)
}
```

## 调试

### 使用 Delve 调试器

安装 Delve:
```bash
go install github.com/go-delve/delve/cmd/dlv@latest
```

启动调试会话:
```bash
dlv debug cmd/server/main.go
```

在 VS Code 中调试,创建 `.vscode/launch.json`:
```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "Launch Server",
            "type": "go",
            "request": "launch",
            "mode": "debug",
            "program": "${workspaceFolder}/cmd/server",
            "env": {},
            "args": []
        }
    ]
}
```

### 日志调试

使用结构化日志:
```go
import "github.com/aton/atonWeb/api/internal/pkg/logger"

// 在代码中添加日志
logger.Info("creating photo", "title", req.Title, "user_id", userID)
logger.Error("database error", "error", err)
```

### 查看 SQL 查询

GORM 会自动打印 SQL 查询(在 debug 模式):
```go
db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
    Logger: logger.Default.LogMode(logger.Info),  // 打印所有 SQL
})
```

## 常见问题排查

### 1. 数据库连接失败

```bash
# 检查 PostgreSQL 是否运行
docker ps | grep postgres

# 检查连接字符串
echo $POSTGRES_DSN

# 测试连接
psql postgresql://aton:yourpassword@localhost:5432/aton_cms
```

### 2. MinIO 上传失败

```bash
# 检查 MinIO 是否运行
docker ps | grep minio

# 访问 MinIO 控制台
open http://localhost:9001

# 检查 bucket 是否存在
# 在 MinIO 控制台创建 "photos" bucket
```

### 3. JWT Token 过期

```bash
# Token 有效期是 24 小时
# 重新登录获取新 token
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'
```

### 4. 端口被占用

```bash
# 查看占用 8080 端口的进程
lsof -i :8080

# 杀死进程
kill -9 <PID>

# 或者在 .env 中修改端口
SERVER_PORT=8081
```

## 性能优化

### 1. 数据库查询优化

```go
// ✅ 使用索引
db.Where("status = ?", "published").
   Order("display_order ASC").
   Find(&photos)

// ✅ 使用分页
db.Limit(20).Offset(0).Find(&photos)

// ✅ 只查询需要的字段
db.Select("id, title, image_url").Find(&photos)

// ❌ 避免 N+1 查询
// 使用 Preload 预加载关联数据
db.Preload("User").Find(&photos)
```

### 2. 缓存策略

```go
// 可以使用 Redis 缓存热点数据
// 例如: 首页照片列表, 用户信息等
```

### 3. 并发处理

```go
// 使用 goroutine 处理耗时操作
go func() {
    // 发送邮件通知
    sendEmailNotification(user.Email)
}()

// 返回响应不需要等待
response.Success(c, photo)
```

## 部署

### 构建生产版本

```bash
# 构建优化的二进制文件
CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -ldflags '-s -w' -o bin/server cmd/server/main.go

# 或使用 Makefile
make build
```

### 使用 Docker

```bash
# 构建镜像
docker build -t aton-cms-api .

# 运行容器
docker run -p 8080:8080 --env-file .env aton-cms-api
```

### 环境变量 (生产环境)

```env
GIN_MODE=release
SERVER_PORT=8080
JWT_SECRET=<strong-random-secret>
POSTGRES_DSN=<production-database-url>
MINIO_ENDPOINT=<production-minio-endpoint>
```

## 贡献指南

### 提交代码前检查清单

- [ ] 代码通过 `go fmt` 格式化
- [ ] 代码通过 `go vet` 检查
- [ ] 代码通过 `golangci-lint` 检查
- [ ] 添加必要的测试
- [ ] 测试全部通过 (`make test`)
- [ ] 更新相关文档
- [ ] Commit 信息清晰明了

### Commit 信息格式

```
<type>: <subject>

<body>

<footer>
```

类型 (type):
- `feat`: 新功能
- `fix`: 修复 bug
- `refactor`: 重构
- `docs`: 文档更新
- `test`: 添加测试
- `chore`: 构建过程或辅助工具的变动

示例:
```
feat: add comment feature to photos

- Add Comment domain entity
- Implement CommentRepository
- Add CommentService with business logic
- Create CommentHandler for HTTP endpoints
- Register comment routes

Closes #123
```

## 学习资源

- [Go 官方文档](https://go.dev/doc/)
- [Effective Go](https://go.dev/doc/effective_go)
- [Go by Example](https://gobyexample.com/)
- [GORM 文档](https://gorm.io/docs/)
- [Gin 框架文档](https://gin-gonic.com/docs/)
- [Clean Architecture - Uncle Bob](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
