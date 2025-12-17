# Go 语言入门指南 - 从 Java 到 Go

> 基于 atonWeb/api 项目的实战学习路径

## 目录
1. [Java vs Go 核心差异](#1-java-vs-go-核心差异)
2. [Go 基础语法速览](#2-go-基础语法速览)
3. [实战案例:Photo API 完整解析](#3-实战案例photo-api-完整解析)
4. [项目架构详解](#4-项目架构详解)
5. [进阶内容](#5-进阶内容)

---

## 1. Java vs Go 核心差异

| 特性 | Java | Go |
|------|------|-----|
| **类型系统** | 类(Class)继承 | 结构体(Struct) + 接口(Interface) 组合 |
| **编译** | JVM 字节码 | 直接编译成机器码 |
| **包管理** | Maven/Gradle | go mod |
| **并发** | Thread + synchronized | Goroutine + Channel |
| **异常处理** | try-catch | 返回 error 值 |
| **空值** | null | nil |
| **泛型** | 支持 | 支持(Go 1.18+) |

### 🔑 关键思维转变
- **没有类**:Go 用 `struct`(结构体)定义数据,用函数绑定方法
- **没有 try-catch**:Go 显式返回 `error`,调用者必须处理
- **没有继承**:Go 用"组合"代替继承

---

## 2. Go 基础语法速览

### 2.1 包(Package)和导入

```go
// Java
package com.example.api;
import java.util.List;
import com.example.model.Photo;

// Go
package main                    // 包名
import (                        // 导入多个包
    "fmt"                       // 标准库
    "github.com/gin-gonic/gin"  // 第三方库
)
```

**规则**:
- 每个 `.go` 文件必须声明 `package`
- `package main` + `func main()` = 程序入口
- 大写开头的标识符是**公开的**(Public),小写是私有的

### 2.2 变量声明

```go
// Java
String name = "Aton";
int age = 18;
List<Photo> hotos = new ArrayList<>();

// Go - 四种方式
var name string = "Aton"       // 完整声明
var age = 18                   // 类型推导
title := "Photo Title"         // 短声明(:=),最常用
var photos []Photo             // 声明切片(类似 List)
```

### 2.3 函数

```go
// Java
public Photo createPhoto(String title, String url) {
    return new Photo(title, url);
}

// Go
func createPhoto(title string, url string) Photo {
    return Photo{Title: title, ImageURL: url}
}

// Go 可以返回多个值(核心特性!)
func divide(a, b int) (int, error) {
    if b == 0 {
        return 0, fmt.Errorf("division by zero")
    }
    return a / b, nil
}
```

### 2.4 结构体(Struct) - 相当于 Java 的 Class

```go
// Java
public class Photo {
    private Long id;
    private String title;

    public Photo(String title) {
        this.title = title;
    }

    public String getTitle() {
        return title;
    }
}

// Go - 没有 getter/setter,直接访问字段
type Photo struct {
    ID    uint   `gorm:"primaryKey" json:"id"`
    Title string `gorm:"size:200" json:"title"`
}

// 创建实例
photo := Photo{
    Title: "Sunset",
}
fmt.Println(photo.Title)  // 直接访问
```

**结构体标签(Tag)**:
- `gorm:"primaryKey"` - GORM(ORM 框架)的数据库配置
- `json:"id"` - JSON 序列化时的字段名

### 2.5 指针(Pointer) - Java 没有的概念

```go
// Java - 所有对象都是引用
Photo photo = new Photo();
modifyPhoto(photo);  // 传递引用

// Go - 明确区分值和指针
photo := Photo{Title: "Old"}

// 传值(复制一份)
func changeTitle(p Photo) {
    p.Title = "New"  // 不影响原变量
}

// 传指针(传递地址)
func changeTitle(p *Photo) {
    p.Title = "New"  // 修改原变量
}

changeTitle(&photo)  // &取地址
```

**何时用指针**:
- ✅ 需要修改原数据
- ✅ 结构体很大,避免复制
- ✅ 方法接收者(receiver)

### 2.6 切片(Slice) - 相当于 Java 的 List

```go
// Java
List<Photo> photos = new ArrayList<>();
photos.add(photo);
int size = photos.size();

// Go
var photos []Photo              // 声明切片
photos = append(photos, photo)  // 添加元素
size := len(photos)             // 长度

// 遍历
for i, photo := range photos {
    fmt.Printf("Index: %d, Title: %s\n", i, photo.Title)
}
```

### 2.7 错误处理 - 核心差异

```go
// Java
try {
    Photo photo = photoService.create(request);
} catch (Exception e) {
    log.error("Failed", e);
}

// Go - 显式检查错误
photo, err := photoService.Create(request)
if err != nil {
    log.Printf("Failed: %v", err)
    return err
}
// 继续处理 photo
```

**Go 的哲学**:
- 错误是**值**,不是异常
- 调用者必须**显式处理**,不能忽略

---

## 3. 实战案例:Photo API 完整解析

让我们用项目中的 Photo 模块,完整走一遍从数据库到 HTTP 响应的全流程。

### 3.1 入口文件:[main.go](cmd/server/main.go)

```go
package main

import (
    "context"
    "log"
    "os"
    "os/signal"
    "syscall"

    "github.com/joho/godotenv"
    "github.com/aton/atonWeb/api/internal/config"
    "github.com/aton/atonWeb/api/internal/server"
)

func main() {
    // 1. 加载环境变量(.env 文件)
    if err := godotenv.Load(); err != nil {
        log.Println("No .env file found")
    }

    // 2. 加载配置
    cfg := config.Load()

    // 3. 创建服务器
    srv := server.New(cfg)

    // 4. 在新 goroutine 中启动服务器
    go func() {
        if err := srv.Run(); err != nil {
            log.Fatalf("server exited: %v", err)
        }
    }()

    // 5. 监听系统信号(Ctrl+C)
    shutdown := make(chan os.Signal, 1)
    signal.Notify(shutdown, syscall.SIGINT, syscall.SIGTERM)
    <-shutdown  // 阻塞,直到收到信号

    // 6. 优雅关闭
    if err := srv.Shutdown(context.Background()); err != nil {
        log.Printf("graceful shutdown failed: %v", err)
    }
}
```

**Java 对比**:
```java
public class Application {
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
        // Spring Boot 自动处理了所有启动/关闭逻辑
    }
}
```

**Go 的区别**:
- 需要手动管理服务器生命周期
- `go func()` 启动 goroutine(轻量级线程)
- `<-shutdown` 从 channel 读取,阻塞主线程
- 显式调用 `Shutdown()` 关闭资源

### 3.2 配置加载:[config.go](internal/config/config.go)

```go
package config

import (
    "fmt"
    "os"
)

// 配置结构体
type Config struct {
    Env         string
    AppHost     string
    AppPort     string
    PostgresDSN string
    JWTSecret   string

    OSSRegion          string
    OSSBucket          string
    OSSAccessKeyID     string
    OSSAccessKeySecret string
    OSSEndpoint        string
}

// 加载配置
func Load() Config {
    return Config{
        Env:         getEnv("ENV", "development"),
        AppHost:     getEnv("API_HOST", "0.0.0.0"),
        AppPort:     getEnv("API_PORT", "8080"),
        PostgresDSN: buildPostgresDSN(),
        JWTSecret:   getEnv("JWT_SECRET", "change-me-in-production"),
        // ... 其他字段
    }
}

// 方法:返回监听地址
func (c Config) Addr() string {
    return fmt.Sprintf("%s:%s", c.AppHost, c.AppPort)
}

// 辅助函数:读取环境变量,带默认值
func getEnv(key, fallback string) string {
    if value := os.Getenv(key); value != "" {
        return value
    }
    return fallback
}

// 构建 PostgreSQL 连接字符串
func buildPostgresDSN() string {
    host := getEnv("POSTGRES_HOST", "db")
    port := getEnv("POSTGRES_PORT", "5432")
    user := getEnv("POSTGRES_USER", "aton")
    password := getEnv("POSTGRES_PASSWORD", "")
    dbName := getEnv("POSTGRES_DB", "atonweb")
    sslMode := getEnv("POSTGRES_SSL_MODE", "disable")

    return fmt.Sprintf(
        "host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
        host, port, user, password, dbName, sslMode,
    )
}
```

**关键点**:
1. **结构体方法**:`func (c Config) Addr()`
   - `(c Config)` 是接收者(receiver),相当于 Java 的 `this`
   - 值接收者(不修改原对象)

2. **包级函数**:`func getEnv()`
   - 没有绑定到结构体,直接调用
   - 相当于 Java 的 `static` 方法

### 3.3 数据模型:[photo.go](internal/model/photo.go)

```go
package model

import "time"

// 数据库模型
type Photo struct {
    ID           uint      `gorm:"primaryKey" json:"id"`
    Title        string    `gorm:"size:200;not null" json:"title"`
    Description  string    `gorm:"type:text" json:"description"`
    ImageURL     string    `gorm:"size:500;not null" json:"imageUrl"`
    ThumbnailURL string    `gorm:"size:500" json:"thumbnailUrl"`
    Category     string    `gorm:"size:50" json:"category"`
    Location     string    `gorm:"size:200" json:"location"`
    IsFeatured   bool      `gorm:"default:false" json:"isFeatured"`
    DisplayOrder int       `gorm:"default:0;index" json:"displayOrder"`
    Status       string    `gorm:"size:20;default:'draft';index" json:"status"`
    CreatedAt    time.Time `json:"createdAt"`
    UpdatedAt    time.Time `json:"updatedAt"`
}

// 创建请求
type CreatePhotoRequest struct {
    Title        string `json:"title" binding:"required,min=1,max=200"`
    Description  string `json:"description"`
    ImageURL     string `json:"imageUrl" binding:"required"`
    ThumbnailURL string `json:"thumbnailUrl"`
    Category     string `json:"category"`
    Location     string `json:"location"`
    IsFeatured   bool   `json:"isFeatured"`
}

// 更新请求
type UpdatePhotoRequest struct {
    Title       *string `json:"title"`        // 指针类型
    Description *string `json:"description"`  // 允许 null
    Category    *string `json:"category"`
    Location    *string `json:"location"`
    IsFeatured  *bool   `json:"isFeatured"`
    Status      *string `json:"status"`
}
```

**为什么 UpdatePhotoRequest 用指针?**

```go
// 问题场景:如何区分"不更新"和"更新为空"?

// ❌ 不用指针 - 无法区分
type UpdateRequest struct {
    Title string  // 空字符串 "" = 不更新?还是清空?
}

// ✅ 用指针 - 清晰表达意图
type UpdateRequest struct {
    Title *string  // nil = 不更新, "" = 清空
}

// 使用示例
req := UpdatePhotoRequest{}
req.Title = nil  // 不更新 title

newTitle := "New Title"
req.Title = &newTitle  // 更新为 "New Title"

emptyTitle := ""
req.Title = &emptyTitle  // 清空 title
```

**Java 对比**:
```java
// Java 用 Optional 或直接 null
public class UpdatePhotoRequest {
    private String title;  // null = 不更新
}
```

### 3.4 服务器核心:[server.go](internal/server/server.go)

```go
package server

import (
    "context"
    "log"
    "net/http"

    "github.com/gin-gonic/gin"
    "gorm.io/driver/postgres"
    "gorm.io/gorm"

    "github.com/aton/atonWeb/api/internal/config"
    "github.com/aton/atonWeb/api/internal/model"
)

// 服务器结构体
type Server struct {
    router *gin.Engine    // HTTP 路由器
    server *http.Server   // HTTP 服务器
    db     *gorm.DB       // 数据库连接
    cfg    config.Config  // 配置
}

// 创建新服务器
func New(cfg config.Config) *Server {
    // 1. 连接数据库
    db, err := gorm.Open(postgres.Open(cfg.PostgresDSN), &gorm.Config{})
    if err != nil {
        log.Fatalf("Failed to connect database: %v", err)
    }

    // 2. 自动迁移(创建表结构)
    if err := db.AutoMigrate(&model.Photo{}); err != nil {
        log.Fatalf("Failed to migrate database: %v", err)
    }

    // 3. 设置 Gin 模式
    if cfg.Env == "production" {
        gin.SetMode(gin.ReleaseMode)
    }

    // 4. 创建路由器
    router := gin.Default()

    // 5. 健康检查端点
    router.GET("/health", func(c *gin.Context) {
        c.JSON(http.StatusOK, gin.H{
            "status": "ok",
            "message": "Aton CMS API is running",
        })
    })

    // 6. API v1 路由组
    v1 := router.Group("/api/v1")
    {
        photos := v1.Group("/photos")
        {
            // GET /api/v1/photos - 查询所有照片
            photos.GET("", func(c *gin.Context) {
                var photosList []model.Photo
                db.Order("display_order ASC").Find(&photosList)

                c.JSON(http.StatusOK, gin.H{
                    "data": photosList,
                    "total": len(photosList),
                })
            })

            // POST /api/v1/photos - 创建照片
            photos.POST("", func(c *gin.Context) {
                var req model.CreatePhotoRequest

                // 绑定 JSON 并验证
                if err := c.ShouldBindJSON(&req); err != nil {
                    c.JSON(http.StatusBadRequest, gin.H{
                        "error": err.Error(),
                    })
                    return
                }

                // 创建 Photo 实例
                photo := model.Photo{
                    Title:        req.Title,
                    Description:  req.Description,
                    ImageURL:     req.ImageURL,
                    ThumbnailURL: req.ThumbnailURL,
                    Category:     req.Category,
                    Location:     req.Location,
                    IsFeatured:   req.IsFeatured,
                    Status:       "draft",
                }

                // 保存到数据库
                if err := db.Create(&photo).Error; err != nil {
                    c.JSON(http.StatusInternalServerError, gin.H{
                        "error": err.Error(),
                    })
                    return
                }

                c.JSON(http.StatusCreated, photo)
            })
        }
    }

    // 7. 返回 Server 实例
    return &Server{
        router: router,
        db:     db,
        cfg:    cfg,
        server: &http.Server{
            Addr:    cfg.Addr(),
            Handler: router,
        },
    }
}

// 启动服务器
func (s *Server) Run() error {
    log.Printf("Starting server on %s", s.cfg.Addr())
    return s.server.ListenAndServe()
}

// 优雅关闭
func (s *Server) Shutdown(ctx context.Context) error {
    log.Println("Shutting down server...")

    // 关闭数据库连接
    sqlDB, err := s.db.DB()
    if err == nil {
        sqlDB.Close()
    }

    return s.server.Shutdown(ctx)
}
```

**核心流程图**:
```
HTTP 请求
    ↓
Gin 路由匹配 (router.GET/POST)
    ↓
绑定/验证请求 (c.ShouldBindJSON)
    ↓
业务逻辑处理
    ↓
GORM 数据库操作 (db.Create/Find)
    ↓
返回 JSON 响应 (c.JSON)
```

**Java Spring Boot 对比**:
```java
@RestController
@RequestMapping("/api/v1/photos")
public class PhotoController {
    @Autowired
    private PhotoRepository photoRepository;

    @GetMapping
    public ResponseEntity<List<Photo>> getPhotos() {
        List<Photo> photos = photoRepository
            .findAll(Sort.by("displayOrder"));
        return ResponseEntity.ok(photos);
    }

    @PostMapping
    public ResponseEntity<Photo> createPhoto(
        @Valid @RequestBody CreatePhotoRequest req
    ) {
        Photo photo = new Photo();
        photo.setTitle(req.getTitle());
        // ... 其他字段
        photo = photoRepository.save(photo);
        return ResponseEntity.status(201).body(photo);
    }
}
```

**Go vs Java**:
- **Go**:手动绑定 JSON、手动错误处理、显式数据库操作
- **Java**:Spring Boot 自动注入、自动验证、JPA 自动持久化

---

## 4. 项目架构详解

```
api/
├── cmd/server/main.go          # 入口文件
├── internal/                   # 内部包(不可被外部导入)
│   ├── config/                 # 配置
│   │   └── config.go
│   ├── model/                  # 数据模型
│   │   └── photo.go
│   ├── handlers/               # HTTP 处理器
│   │   └── health.go
│   ├── repository/             # 数据访问层(TODO)
│   ├── service/                # 业务逻辑层(TODO)
│   ├── middleware/             # 中间件(TODO)
│   └── server/                 # 服务器核心
│       └── server.go
├── pkg/                        # 可导出的库
│   ├── jwt/                    # JWT 工具
│   ├── storage/                # 文件存储
│   └── utils/                  # 通用工具
├── go.mod                      # 依赖管理
├── go.sum                      # 依赖校验
└── .env                        # 环境变量
```

### 4.1 internal vs pkg

- **internal/**: 私有包,只能被当前项目导入
- **pkg/**: 公开包,可以被其他项目导入

**为什么这么设计?**
- 强制模块边界
- 防止外部依赖内部实现

### 4.2 典型分层架构(MVC 变体)

```
Handler (Controller)
    ↓
Service (业务逻辑)
    ↓
Repository (数据访问)
    ↓
Database
```

**当前项目状态**:Handler 和 Repository 耦合在一起(简化版),适合学习。

**生产级改进**:
```go
// repository/photo_repository.go
type PhotoRepository interface {
    FindAll() ([]model.Photo, error)
    Create(photo *model.Photo) error
}

// service/photo_service.go
type PhotoService struct {
    repo repository.PhotoRepository
}

// handlers/photo_handler.go
type PhotoHandler struct {
    service *service.PhotoService
}
```

---

## 5. 进阶内容

### 5.1 接口(Interface) - Go 的核心设计

```go
// Java - 显式实现
public interface Repository {
    Photo findById(Long id);
}

public class PhotoRepository implements Repository {
    @Override
    public Photo findById(Long id) { ... }
}

// Go - 隐式实现(鸭子类型)
type Repository interface {
    FindByID(uint) (*Photo, error)
}

type PostgresRepository struct {
    db *gorm.DB
}

// 只要有这个方法,就自动实现了 Repository 接口
func (r *PostgresRepository) FindByID(id uint) (*Photo, error) {
    var photo Photo
    err := r.db.First(&photo, id).Error
    return &photo, err
}
```

**优势**:
- 解耦定义和实现
- 方便测试(mock)

### 5.2 并发:Goroutine + Channel

```go
// Java
ExecutorService executor = Executors.newFixedThreadPool(10);
executor.submit(() -> {
    // 后台任务
});

// Go
go func() {
    // 后台任务
}()

// Channel 通信
results := make(chan Photo, 10)

go func() {
    photo := fetchPhoto()
    results <- photo  // 发送到 channel
}()

photo := <-results  // 从 channel 接收
```

**使用场景**:
- 异步任务
- 并行处理
- 生产者-消费者模式

### 5.3 中间件(Middleware)

```go
// 日志中间件
func Logger() gin.HandlerFunc {
    return func(c *gin.Context) {
        start := time.Now()

        c.Next()  // 执行下一个处理器

        duration := time.Since(start)
        log.Printf(
            "%s %s %d %v",
            c.Request.Method,
            c.Request.URL.Path,
            c.Writer.Status(),
            duration,
        )
    }
}

// 使用
router.Use(Logger())
```

### 5.4 错误处理最佳实践

```go
// ❌ 不好:吞掉错误
db.Create(&photo)

// ✅ 好:检查并处理
if err := db.Create(&photo).Error; err != nil {
    return fmt.Errorf("failed to create photo: %w", err)
}

// ✅ 更好:自定义错误
type ValidationError struct {
    Field string
    Msg   string
}

func (e ValidationError) Error() string {
    return fmt.Sprintf("%s: %s", e.Field, e.Msg)
}
```

### 5.5 单元测试

```go
// photo_test.go
package model

import (
    "testing"
    "github.com/stretchr/testify/assert"
)

func TestPhotoValidation(t *testing.T) {
    photo := Photo{
        Title: "Test",
        ImageURL: "https://example.com/photo.jpg",
    }

    assert.NotEmpty(t, photo.Title)
    assert.NotEmpty(t, photo.ImageURL)
}
```

运行测试:
```bash
go test ./...
```

---

## 快速上手步骤

1. **安装 Go**:
   ```bash
   # 检查版本
   go version  # 应该是 1.24+
   ```

2. **运行项目**:
   ```bash
   cd api
   go mod download  # 下载依赖
   go run cmd/server/main.go
   ```

3. **测试 API**:
   ```bash
   # 健康检查
   curl http://localhost:8080/health

   # 创建照片
   curl -X POST http://localhost:8080/api/v1/photos \
     -H "Content-Type: application/json" \
     -d '{
       "title": "Sunset",
       "imageUrl": "https://example.com/sunset.jpg"
     }'

   # 查询所有照片
   curl http://localhost:8080/api/v1/photos
   ```

4. **修改代码并观察**:
   - 在 [server.go](internal/server/server.go) 添加新路由
   - 在 [photo.go](internal/model/photo.go) 添加新字段
   - 重启服务器查看效果

---

## 学习建议

1. **按顺序理解**:
   - main.go(入口) → config.go(配置) → server.go(核心) → model.go(数据)

2. **对比 Java**:
   - 每学一个概念,想想 Java 怎么做
   - 理解 Go 的"简单直接"哲学

3. **动手实践**:
   - 添加 `GET /api/v1/photos/:id` 接口
   - 实现 `PUT /api/v1/photos/:id` 更新接口
   - 添加用户(User)模型

4. **阅读标准库**:
   - `net/http` - HTTP 基础
   - `encoding/json` - JSON 处理
   - `context` - 上下文传递

---

## 常见问题

### Q: Go 没有类,怎么做 OOP?
**A**: Go 用"组合"代替"继承":
```go
type Base struct {
    ID uint
}

type Photo struct {
    Base       // 嵌入(组合)
    Title string
}

photo := Photo{
    Base: Base{ID: 1},
    Title: "Photo",
}
photo.ID  // 直接访问
```

### Q: 为什么到处都是 `if err != nil`?
**A**: Go 强制显式处理错误,避免隐藏问题。习惯后会觉得很清晰。

### Q: `:=` 和 `=` 有什么区别?
**A**:
- `:=` 短声明,只能在函数内使用
- `=` 赋值,用于已声明的变量

```go
name := "Aton"   // 声明并赋值
name = "Bob"     // 重新赋值
```

### Q: `*Photo` 和 `Photo` 什么时候用哪个?
**A**:
- 需要修改原数据 → 用 `*Photo`
- 只读数据 → 用 `Photo`
- 结构体很大 → 用 `*Photo` 避免复制

---

## 下一步

- 📚 阅读 [Effective Go](https://go.dev/doc/effective_go)
- 🏗️ 实现完整的 CRUD(增删改查)
- 🔐 添加 JWT 认证
- 🧪 编写单元测试
- 🚀 学习 Docker 部署

Good luck! 有问题随时问。
