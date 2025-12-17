# Backend Architecture Documentation

## 架构概述

本项目采用 **Clean Architecture** (整洁架构) 设计,结合 **Go Standard Project Layout** (Go 标准项目布局),实现清晰的分层和关注点分离。

## 为什么选择 Clean Architecture?

Clean Architecture 由 Robert C. Martin (Uncle Bob) 提出,核心原则是:

1. **独立于框架** - 业务逻辑不依赖特定框架
2. **可测试** - 业务规则可以不依赖 UI、数据库等进行测试
3. **独立于 UI** - UI 可以轻松更换,不影响业务逻辑
4. **独立于数据库** - 可以切换 PostgreSQL 到 MySQL 而不改变业务规则
5. **独立于外部服务** - 业务规则对外部世界一无所知

## 目录结构

```
api/
├── cmd/                        # 应用程序入口
│   └── server/
│       └── main.go            # 主程序入口
│
├── internal/                   # 私有应用代码
│   ├── domain/                # 领域层 (最核心)
│   │   ├── photo.go          # Photo 实体
│   │   └── user.go           # User 实体
│   │
│   ├── usecase/               # 用例层 (业务逻辑)
│   │   ├── photo_service.go  # 照片业务逻辑
│   │   ├── auth_service.go   # 认证业务逻辑
│   │   └── storage_service.go # 存储业务逻辑
│   │
│   ├── repository/            # 仓储层 (数据访问接口)
│   │   └── photo_repo.go     # 照片数据访问
│   │
│   ├── delivery/              # 交付层 (外部接口)
│   │   └── http/             # HTTP 传输层
│   │       ├── handler/      # HTTP 处理器
│   │       │   ├── photo.go
│   │       │   ├── auth.go
│   │       │   └── storage.go
│   │       └── middleware/   # HTTP 中间件
│   │           └── auth.go
│   │
│   ├── infrastructure/        # 基础设施层
│   │   └── jwt/              # JWT 实现
│   │       └── jwt.go
│   │
│   ├── pkg/                   # 共享工具包
│   │   ├── response/         # 统一响应格式
│   │   ├── errors/           # 统一错误处理
│   │   └── logger/           # 结构化日志
│   │
│   ├── config/                # 配置管理
│   │   └── config.go
│   │
│   └── server/                # 服务器启动和路由
│       └── server.go
│
├── Makefile                    # 常用命令
├── go.mod                      # Go 模块定义
└── go.sum                      # Go 依赖锁定
```

## 分层详解

### 1. Domain Layer (领域层) - `internal/domain/`

**职责**: 定义核心业务实体和业务规则

**特点**:
- 不依赖任何其他层
- 包含业务实体的属性和行为
- 包含业务规则和验证逻辑

**示例**: `Photo` 实体定义了照片的属性,`User` 实体包含密码哈希方法

```go
type User struct {
    ID       uint
    Username string
    Password string
}

func (u *User) HashPassword(password string) error {
    // 业务规则: 密码必须使用 bcrypt 加密
}
```

### 2. Usecase Layer (用例层) - `internal/usecase/`

**职责**: 实现业务逻辑和用例流程

**特点**:
- 依赖 Domain Layer 和 Repository 接口
- 实现具体的业务流程
- 不依赖外部框架和库

**示例**: `AuthService` 实现登录逻辑,验证用户名密码,生成 JWT token

```go
func (s *authService) Login(username, password string) (string, error) {
    // 1. 查询用户
    // 2. 验证密码
    // 3. 生成 token
}
```

### 3. Repository Layer (仓储层) - `internal/repository/`

**职责**: 定义数据访问接口并实现

**特点**:
- 提供数据访问抽象
- 隐藏数据库实现细节
- 可以轻松切换数据库

**示例**: `PhotoRepository` 接口定义 CRUD 方法

```go
type PhotoRepository interface {
    Create(photo *domain.Photo) error
    GetByID(id uint) (*domain.Photo, error)
    List(filters PhotoFilters) ([]domain.Photo, int64, error)
}
```

### 4. Delivery Layer (交付层) - `internal/delivery/http/`

**职责**: 处理 HTTP 请求和响应

**特点**:
- 依赖 Usecase Layer
- 处理 HTTP 协议细节
- 参数验证和格式转换

**示例**: `PhotoHandler` 处理照片相关的 HTTP 请求

```go
func (h *PhotoHandler) Create(c *gin.Context) {
    // 1. 解析请求
    // 2. 调用 usecase
    // 3. 返回响应
}
```

### 5. Infrastructure Layer (基础设施层) - `internal/infrastructure/`

**职责**: 实现技术细节和外部依赖

**特点**:
- JWT 令牌管理
- 第三方服务集成
- 技术实现细节

**示例**: `JWTManager` 实现 token 生成和验证

### 6. Pkg Layer (工具层) - `internal/pkg/`

**职责**: 提供可复用的工具和辅助函数

**特点**:
- 统一响应格式 (`response`)
- 统一错误处理 (`errors`)
- 结构化日志 (`logger`)

## 依赖关系图

```
┌─────────────────────────────────────┐
│         Delivery (HTTP)             │
│    handlers, middleware, router     │
└────────────────┬────────────────────┘
                 │ 依赖
                 ↓
┌─────────────────────────────────────┐
│          Usecase (Business)         │
│    business logic, workflows        │
└────────────────┬────────────────────┘
                 │ 依赖
                 ↓
┌─────────────────────────────────────┐
│       Repository (Data Access)      │
│      interfaces, implementations    │
└────────────────┬────────────────────┘
                 │ 依赖
                 ↓
┌─────────────────────────────────────┐
│         Domain (Core Business)      │
│        entities, business rules     │
└─────────────────────────────────────┘

                 ↑
                 │ 所有层都可以依赖
                 │
┌─────────────────────────────────────┐
│     Infrastructure & Pkg (Tools)    │
│    jwt, logger, errors, response    │
└─────────────────────────────────────┘
```

**依赖规则**:
- 外层可以依赖内层
- 内层不能依赖外层
- Domain 层不依赖任何层
- Infrastructure 和 Pkg 可以被所有层使用

## 数据流动

### 创建照片的流程示例:

```
1. Client Request
   ↓
2. HTTP Handler (delivery/http/handler/photo.go)
   - 解析 JSON 请求
   - 验证参数
   ↓
3. Photo Usecase (usecase/photo_service.go)
   - 执行业务逻辑
   - 验证业务规则
   ↓
4. Photo Repository (repository/photo_repo.go)
   - 执行数据库操作
   ↓
5. Domain Entity (domain/photo.go)
   - 创建 Photo 实体
   ↓
6. Return through layers
   Repository → Usecase → Handler → Client
```

## 最佳实践

### 1. 单一职责原则
每个文件只负责一件事:
- Handler 只处理 HTTP
- Usecase 只处理业务逻辑
- Repository 只处理数据访问

### 2. 依赖注入
通过构造函数注入依赖:

```go
func NewPhotoHandler(service usecase.PhotoService) *PhotoHandler {
    return &PhotoHandler{service: service}
}
```

### 3. 接口隔离
定义小而专注的接口:

```go
type PhotoService interface {
    Create(req *CreatePhotoRequest) (*domain.Photo, error)
    GetByID(id uint) (*domain.Photo, error)
}
```

### 4. 错误处理
使用统一的错误类型:

```go
var (
    ErrPhotoNotFound = errors.New("photo not found")
    ErrUnauthorized  = errors.New("unauthorized")
)
```

## 如何添加新功能

### 示例: 添加评论 (Comments) 功能

1. **定义领域实体** - `internal/domain/comment.go`
   ```go
   type Comment struct {
       ID      uint
       Content string
       PhotoID uint
       UserID  uint
   }
   ```

2. **创建仓储接口** - `internal/repository/comment_repo.go`
   ```go
   type CommentRepository interface {
       Create(comment *domain.Comment) error
       ListByPhotoID(photoID uint) ([]domain.Comment, error)
   }
   ```

3. **实现业务逻辑** - `internal/usecase/comment_service.go`
   ```go
   type CommentService interface {
       AddComment(photoID uint, content string) error
   }
   ```

4. **添加 HTTP 处理器** - `internal/delivery/http/handler/comment.go`
   ```go
   func (h *CommentHandler) Create(c *gin.Context) {
       // 处理 POST /api/v1/comments
   }
   ```

5. **注册路由** - `internal/server/server.go`
   ```go
   comments := v1.Group("/comments")
   comments.POST("", commentHandler.Create)
   ```

## 测试策略

### 单元测试
- Domain: 测试业务规则
- Usecase: 使用 mock repository 测试
- Handler: 使用 mock usecase 测试

### 集成测试
- 测试完整的请求流程
- 使用测试数据库

### 示例测试
```go
func TestPhotoService_Create(t *testing.T) {
    mockRepo := &MockPhotoRepository{}
    service := NewPhotoService(mockRepo)

    photo, err := service.Create(&CreatePhotoRequest{
        Title: "Test",
    })

    assert.NoError(t, err)
    assert.NotNil(t, photo)
}
```

## 常见问题

### Q: 为什么要分这么多层?
A: 分层使得代码更容易理解、测试和维护。每层有明确的职责,修改一层不影响其他层。

### Q: Usecase 和 Service 有什么区别?
A: 在本项目中,我们使用 Usecase 这个术语来强调"用例"的概念,但本质上和 Service 是一样的,都是业务逻辑层。

### Q: 什么时候使用 pkg vs infrastructure?
A:
- `pkg`: 通用工具,可以在任何项目中复用 (logger, response, errors)
- `infrastructure`: 特定技术实现,与业务相关 (jwt, minio, email)

### Q: Repository 必须是接口吗?
A: 是的。使用接口可以:
1. 便于编写单元测试 (mock)
2. 可以轻松切换实现 (PostgreSQL → MySQL)
3. 符合依赖倒置原则

## 参考资料

- [The Clean Architecture - Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Go Standard Project Layout](https://github.com/golang-standards/project-layout)
- [Domain-Driven Design](https://en.wikipedia.org/wiki/Domain-driven_design)
