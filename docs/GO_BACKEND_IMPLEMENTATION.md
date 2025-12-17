# Go 后端实现方案

> 本文档是 CMS_DESIGN.md 的补充，详细说明 Go 后端的实现方案

---

## 项目结构

```
atonWeb/
├── api/                          # Go 后端服务
│   ├── cmd/
│   │   └── server/
│   │       └── main.go           # 入口文件
│   ├── internal/
│   │   ├── handler/              # HTTP 处理器（Controller 层）
│   │   │   ├── auth.go
│   │   │   ├── photo.go
│   │   │   ├── profile.go
│   │   │   └── upload.go
│   │   ├── service/              # 业务逻辑层
│   │   │   ├── auth_service.go
│   │   │   ├── photo_service.go
│   │   │   └── storage_service.go
│   │   ├── repository/           # 数据访问层（DAO）
│   │   │   ├── user_repo.go
│   │   │   └── photo_repo.go
│   │   ├── model/                # 数据模型
│   │   │   ├── user.go
│   │   │   ├── photo.go
│   │   │   └── dto.go            # 数据传输对象
│   │   ├── middleware/           # 中间件
│   │   │   ├── auth.go           # JWT 认证
│   │   │   ├── cors.go           # 跨域
│   │   │   └── logger.go         # 日志
│   │   └── config/               # 配置
│   │       └── config.go
│   ├── pkg/                      # 公共包（可被外部引用）
│   │   ├── jwt/                  # JWT 工具
│   │   ├── storage/              # 云存储客户端
│   │   │   ├── oss.go            # 阿里云 OSS
│   │   │   └── interface.go      # 存储接口
│   │   └── utils/                # 工具函数
│   ├── migrations/               # 数据库迁移文件
│   │   ├── 000001_create_users_table.up.sql
│   │   ├── 000001_create_users_table.down.sql
│   │   └── ...
│   ├── Dockerfile
│   ├── go.mod
│   ├── go.sum
│   └── .env.example
└── web/                          # Next.js 前端
    └── ...
```

---

## 技术栈

| 组件 | 技术选型 | 理由 |
|------|---------|------|
| Web 框架 | Gin | 轻量、高性能、文档完善 |
| ORM | GORM | Go 最流行的 ORM，支持迁移 |
| 数据库 | PostgreSQL | 关系型数据库，功能强大 |
| 认证 | JWT-go | 无状态认证 |
| 云存储 | aliyun-oss-go-sdk | 阿里云 OSS SDK |
| 配置管理 | Viper | 多格式配置文件支持 |
| 日志 | Zap | 高性能结构化日志 |
| 验证 | go-playground/validator | 输入验证 |
| 迁移工具 | golang-migrate | 数据库版本管理 |

---

## 核心代码示例

### 1. 项目入口 (`cmd/server/main.go`)

```go
package main

import (
	"log"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"

	"atonweb/internal/config"
	"atonweb/internal/handler"
	"atonweb/internal/middleware"
	"atonweb/internal/repository"
	"atonweb/internal/service"
)

func main() {
	// 加载环境变量
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found")
	}

	// 加载配置
	cfg := config.Load()

	// 连接数据库
	db, err := gorm.Open(postgres.Open(cfg.DatabaseURL), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	// 初始化仓储层
	userRepo := repository.NewUserRepository(db)
	photoRepo := repository.NewPhotoRepository(db)

	// 初始化服务层
	authService := service.NewAuthService(userRepo, cfg.JWTSecret)
	photoService := service.NewPhotoService(photoRepo)
	storageService := service.NewStorageService(cfg)

	// 初始化处理器
	authHandler := handler.NewAuthHandler(authService)
	photoHandler := handler.NewPhotoHandler(photoService)
	uploadHandler := handler.NewUploadHandler(storageService)

	// 设置 Gin
	if cfg.Env == "production" {
		gin.SetMode(gin.ReleaseMode)
	}
	r := gin.Default()

	// 全局中间件
	r.Use(middleware.CORS())
	r.Use(middleware.Logger())

	// 路由
	api := r.Group("/api")
	{
		// 公开路由
		api.POST("/auth/login", authHandler.Login)

		// 需要认证的路由
		authenticated := api.Group("")
		authenticated.Use(middleware.AuthMiddleware(cfg.JWTSecret))
		{
			authenticated.POST("/auth/logout", authHandler.Logout)
			authenticated.GET("/auth/me", authHandler.Me)

			authenticated.GET("/photos", photoHandler.List)
			authenticated.POST("/photos", photoHandler.Create)
			authenticated.GET("/photos/:id", photoHandler.GetByID)
			authenticated.PATCH("/photos/:id", photoHandler.Update)
			authenticated.DELETE("/photos/:id", photoHandler.Delete)
			authenticated.PUT("/photos/reorder", photoHandler.Reorder)

			authenticated.POST("/upload", uploadHandler.Upload)
		}
	}

	// 启动服务器
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	log.Printf("Server starting on :%s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}
```

---

### 2. 配置管理 (`internal/config/config.go`)

```go
package config

import (
	"os"
)

type Config struct {
	Env         string
	DatabaseURL string
	JWTSecret   string

	// OSS 配置
	OSSRegion          string
	OSSBucket          string
	OSSAccessKeyID     string
	OSSAccessKeySecret string
	OSSEndpoint        string
}

func Load() *Config {
	return &Config{
		Env:                os.Getenv("ENV"),
		DatabaseURL:        os.Getenv("DATABASE_URL"),
		JWTSecret:          os.Getenv("JWT_SECRET"),
		OSSRegion:          os.Getenv("OSS_REGION"),
		OSSBucket:          os.Getenv("OSS_BUCKET"),
		OSSAccessKeyID:     os.Getenv("OSS_ACCESS_KEY_ID"),
		OSSAccessKeySecret: os.Getenv("OSS_ACCESS_KEY_SECRET"),
		OSSEndpoint:        os.Getenv("OSS_ENDPOINT"),
	}
}
```

---

### 3. 数据模型 (`internal/model/photo.go`)

```go
package model

import (
	"time"

	"github.com/lib/pq"
)

type Photo struct {
	ID           uint           `gorm:"primaryKey" json:"id"`
	Title        string         `gorm:"size:200;not null" json:"title"`
	Description  string         `gorm:"type:text" json:"description"`
	ImageURL     string         `gorm:"size:500;not null" json:"imageUrl"`
	ThumbnailURL string         `gorm:"size:500" json:"thumbnailUrl"`
	Category     string         `gorm:"size:50" json:"category"`
	Tags         pq.StringArray `gorm:"type:text[]" json:"tags"`
	Location     string         `gorm:"size:200" json:"location"`
	CameraInfo   *CameraInfo    `gorm:"type:jsonb" json:"cameraInfo,omitempty"`
	IsFeatured   bool           `gorm:"default:false" json:"isFeatured"`
	DisplayOrder int            `gorm:"default:0;index" json:"displayOrder"`
	Status       string         `gorm:"size:20;default:'draft';index" json:"status"`
	CreatedAt    time.Time      `json:"createdAt"`
	UpdatedAt    time.Time      `json:"updatedAt"`
}

type CameraInfo struct {
	Model    string `json:"model"`
	Lens     string `json:"lens"`
	ISO      int    `json:"iso"`
	Aperture string `json:"aperture"`
	Shutter  string `json:"shutter"`
}

// DTO（数据传输对象）
type CreatePhotoRequest struct {
	Title        string      `json:"title" binding:"required,min=1,max=200"`
	Description  string      `json:"description"`
	ImageURL     string      `json:"imageUrl" binding:"required,url"`
	ThumbnailURL string      `json:"thumbnailUrl" binding:"omitempty,url"`
	Category     string      `json:"category"`
	Tags         []string    `json:"tags"`
	Location     string      `json:"location"`
	CameraInfo   *CameraInfo `json:"cameraInfo"`
	IsFeatured   bool        `json:"isFeatured"`
}

type UpdatePhotoRequest struct {
	Title        *string     `json:"title" binding:"omitempty,min=1,max=200"`
	Description  *string     `json:"description"`
	Category     *string     `json:"category"`
	Tags         []string    `json:"tags"`
	Location     *string     `json:"location"`
	CameraInfo   *CameraInfo `json:"cameraInfo"`
	IsFeatured   *bool       `json:"isFeatured"`
	Status       *string     `json:"status" binding:"omitempty,oneof=draft published archived"`
}
```

---

### 4. 仓储层 (`internal/repository/photo_repo.go`)

```go
package repository

import (
	"atonweb/internal/model"
	"gorm.io/gorm"
)

type PhotoRepository interface {
	Create(photo *model.Photo) error
	FindByID(id uint) (*model.Photo, error)
	List(filter PhotoFilter) ([]model.Photo, int64, error)
	Update(photo *model.Photo) error
	Delete(id uint) error
	UpdateOrder(id uint, order int) error
}

type photoRepository struct {
	db *gorm.DB
}

func NewPhotoRepository(db *gorm.DB) PhotoRepository {
	return &photoRepository{db: db}
}

type PhotoFilter struct {
	Status   string
	Category string
	Featured *bool
	Page     int
	Limit    int
}

func (r *photoRepository) Create(photo *model.Photo) error {
	return r.db.Create(photo).Error
}

func (r *photoRepository) FindByID(id uint) (*model.Photo, error) {
	var photo model.Photo
	err := r.db.First(&photo, id).Error
	if err != nil {
		return nil, err
	}
	return &photo, nil
}

func (r *photoRepository) List(filter PhotoFilter) ([]model.Photo, int64, error) {
	var photos []model.Photo
	var total int64

	query := r.db.Model(&model.Photo{})

	// 应用过滤条件
	if filter.Status != "" {
		query = query.Where("status = ?", filter.Status)
	}
	if filter.Category != "" {
		query = query.Where("category = ?", filter.Category)
	}
	if filter.Featured != nil {
		query = query.Where("is_featured = ?", *filter.Featured)
	}

	// 获取总数
	query.Count(&total)

	// 分页
	offset := (filter.Page - 1) * filter.Limit
	err := query.Order("display_order ASC, created_at DESC").
		Offset(offset).
		Limit(filter.Limit).
		Find(&photos).Error

	return photos, total, err
}

func (r *photoRepository) Update(photo *model.Photo) error {
	return r.db.Save(photo).Error
}

func (r *photoRepository) Delete(id uint) error {
	return r.db.Delete(&model.Photo{}, id).Error
}

func (r *photoRepository) UpdateOrder(id uint, order int) error {
	return r.db.Model(&model.Photo{}).Where("id = ?", id).Update("display_order", order).Error
}
```

---

### 5. 服务层 (`internal/service/photo_service.go`)

```go
package service

import (
	"atonweb/internal/model"
	"atonweb/internal/repository"
	"errors"
)

type PhotoService interface {
	CreatePhoto(req *model.CreatePhotoRequest) (*model.Photo, error)
	GetPhoto(id uint) (*model.Photo, error)
	ListPhotos(filter repository.PhotoFilter) ([]model.Photo, int64, error)
	UpdatePhoto(id uint, req *model.UpdatePhotoRequest) (*model.Photo, error)
	DeletePhoto(id uint) error
	ReorderPhotos(orders []struct{ ID uint; Order int }) error
}

type photoService struct {
	repo repository.PhotoRepository
}

func NewPhotoService(repo repository.PhotoRepository) PhotoService {
	return &photoService{repo: repo}
}

func (s *photoService) CreatePhoto(req *model.CreatePhotoRequest) (*model.Photo, error) {
	photo := &model.Photo{
		Title:        req.Title,
		Description:  req.Description,
		ImageURL:     req.ImageURL,
		ThumbnailURL: req.ThumbnailURL,
		Category:     req.Category,
		Tags:         req.Tags,
		Location:     req.Location,
		CameraInfo:   req.CameraInfo,
		IsFeatured:   req.IsFeatured,
		Status:       "draft",
	}

	if err := s.repo.Create(photo); err != nil {
		return nil, err
	}
	return photo, nil
}

func (s *photoService) GetPhoto(id uint) (*model.Photo, error) {
	return s.repo.FindByID(id)
}

func (s *photoService) ListPhotos(filter repository.PhotoFilter) ([]model.Photo, int64, error) {
	if filter.Page <= 0 {
		filter.Page = 1
	}
	if filter.Limit <= 0 {
		filter.Limit = 20
	}
	return s.repo.List(filter)
}

func (s *photoService) UpdatePhoto(id uint, req *model.UpdatePhotoRequest) (*model.Photo, error) {
	photo, err := s.repo.FindByID(id)
	if err != nil {
		return nil, err
	}

	// 只更新非 nil 字段
	if req.Title != nil {
		photo.Title = *req.Title
	}
	if req.Description != nil {
		photo.Description = *req.Description
	}
	if req.Category != nil {
		photo.Category = *req.Category
	}
	if req.Tags != nil {
		photo.Tags = req.Tags
	}
	if req.Location != nil {
		photo.Location = *req.Location
	}
	if req.CameraInfo != nil {
		photo.CameraInfo = req.CameraInfo
	}
	if req.IsFeatured != nil {
		photo.IsFeatured = *req.IsFeatured
	}
	if req.Status != nil {
		photo.Status = *req.Status
	}

	if err := s.repo.Update(photo); err != nil {
		return nil, err
	}
	return photo, nil
}

func (s *photoService) DeletePhoto(id uint) error {
	return s.repo.Delete(id)
}

func (s *photoService) ReorderPhotos(orders []struct{ ID uint; Order int }) error {
	for _, o := range orders {
		if err := s.repo.UpdateOrder(o.ID, o.Order); err != nil {
			return err
		}
	}
	return nil
}
```

---

### 6. 处理器层 (`internal/handler/photo.go`)

```go
package handler

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"atonweb/internal/model"
	"atonweb/internal/repository"
	"atonweb/internal/service"
)

type PhotoHandler struct {
	service service.PhotoService
}

func NewPhotoHandler(service service.PhotoService) *PhotoHandler {
	return &PhotoHandler{service: service}
}

// 创建作品
func (h *PhotoHandler) Create(c *gin.Context) {
	var req model.CreatePhotoRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	photo, err := h.service.CreatePhoto(&req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, photo)
}

// 获取作品列表
func (h *PhotoHandler) List(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	filter := repository.PhotoFilter{
		Status:   c.Query("status"),
		Category: c.Query("category"),
		Page:     page,
		Limit:    limit,
	}

	if featured := c.Query("featured"); featured != "" {
		val := featured == "true"
		filter.Featured = &val
	}

	photos, total, err := h.service.ListPhotos(filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": photos,
		"pagination": gin.H{
			"total": total,
			"page":  page,
			"limit": limit,
		},
	})
}

// 获取单个作品
func (h *PhotoHandler) GetByID(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	photo, err := h.service.GetPhoto(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Photo not found"})
		return
	}

	c.JSON(http.StatusOK, photo)
}

// 更新作品
func (h *PhotoHandler) Update(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	var req model.UpdatePhotoRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	photo, err := h.service.UpdatePhoto(uint(id), &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, photo)
}

// 删除作品
func (h *PhotoHandler) Delete(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	if err := h.service.DeletePhoto(uint(id)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Photo deleted successfully"})
}

// 批量调整顺序
func (h *PhotoHandler) Reorder(c *gin.Context) {
	var req struct {
		Orders []struct {
			ID    uint `json:"id" binding:"required"`
			Order int  `json:"order" binding:"required"`
		} `json:"orders" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.service.ReorderPhotos(req.Orders); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Order updated successfully"})
}
```

---

### 7. JWT 中间件 (`internal/middleware/auth.go`)

```go
package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

func AuthMiddleware(jwtSecret string) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Missing authorization header"})
			c.Abort()
			return
		}

		// 提取 token（格式：Bearer <token>）
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid authorization header"})
			c.Abort()
			return
		}

		tokenString := parts[1]

		// 验证 token
		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			return []byte(jwtSecret), nil
		})

		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			c.Abort()
			return
		}

		// 提取用户信息
		if claims, ok := token.Claims.(jwt.MapClaims); ok {
			c.Set("userId", uint(claims["userId"].(float64)))
			c.Set("username", claims["username"].(string))
		}

		c.Next()
	}
}
```

---

### 8. 云存储服务 (`pkg/storage/oss.go`)

```go
package storage

import (
	"fmt"
	"io"
	"path/filepath"
	"time"

	"github.com/aliyun/aliyun-oss-go-sdk/oss"
	"github.com/google/uuid"
)

type OSSClient struct {
	client *oss.Client
	bucket *oss.Bucket
}

func NewOSSClient(endpoint, accessKeyID, accessKeySecret, bucketName string) (*OSSClient, error) {
	client, err := oss.New(endpoint, accessKeyID, accessKeySecret)
	if err != nil {
		return nil, err
	}

	bucket, err := client.Bucket(bucketName)
	if err != nil {
		return nil, err
	}

	return &OSSClient{
		client: client,
		bucket: bucket,
	}, nil
}

func (c *OSSClient) Upload(file io.Reader, filename string) (string, error) {
	// 生成唯一文件名
	ext := filepath.Ext(filename)
	objectKey := fmt.Sprintf("photos/%s/%s%s",
		time.Now().Format("2006/01"),
		uuid.New().String(),
		ext,
	)

	// 上传文件
	err := c.bucket.PutObject(objectKey, file)
	if err != nil {
		return "", err
	}

	// 返回公开访问 URL
	url := fmt.Sprintf("https://%s.%s/%s",
		c.bucket.BucketName,
		c.client.Config.Endpoint,
		objectKey,
	)

	return url, nil
}

func (c *OSSClient) Delete(url string) error {
	// 从 URL 提取 objectKey
	// TODO: 实现
	return nil
}
```

---

### 9. 上传处理器 (`internal/handler/upload.go`)

```go
package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"atonweb/internal/service"
)

type UploadHandler struct {
	storageService service.StorageService
}

func NewUploadHandler(storageService service.StorageService) *UploadHandler {
	return &UploadHandler{storageService: storageService}
}

func (h *UploadHandler) Upload(c *gin.Context) {
	file, header, err := c.Request.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No file uploaded"})
		return
	}
	defer file.Close()

	// 验证文件类型
	if !isValidImageType(header.Filename) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid file type. Only jpg, png, gif allowed"})
		return
	}

	// 验证文件大小（最大 10MB）
	if header.Size > 10*1024*1024 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "File too large. Max 10MB"})
		return
	}

	// 上传到云存储
	url, err := h.storageService.Upload(file, header.Filename)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to upload file"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"url":          url,
		"thumbnailUrl": url + "?x-oss-process=image/resize,w_300", // OSS 图片处理
	})
}

func isValidImageType(filename string) bool {
	ext := filepath.Ext(filename)
	validExts := []string{".jpg", ".jpeg", ".png", ".gif", ".webp"}
	for _, validExt := range validExts {
		if strings.ToLower(ext) == validExt {
			return true
		}
	}
	return false
}
```

---

## 数据库迁移

使用 `golang-migrate` 管理数据库版本：

```bash
# 安装工具
go install -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@latest

# 创建迁移文件
migrate create -ext sql -dir migrations -seq create_photos_table

# 执行迁移
migrate -database "postgres://user:pass@localhost:5432/atonweb?sslmode=disable" -path migrations up

# 回滚
migrate -database "postgres://user:pass@localhost:5432/atonweb?sslmode=disable" -path migrations down
```

迁移文件示例：

```sql
-- migrations/000002_create_photos_table.up.sql
CREATE TABLE photos (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  image_url VARCHAR(500) NOT NULL,
  thumbnail_url VARCHAR(500),
  category VARCHAR(50),
  tags TEXT[],
  location VARCHAR(200),
  camera_info JSONB,
  is_featured BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_photos_status ON photos(status);
CREATE INDEX idx_photos_featured ON photos(is_featured);
CREATE INDEX idx_photos_order ON photos(display_order);
```

---

## Docker 配置

### Dockerfile (api/Dockerfile)

```dockerfile
# 构建阶段
FROM golang:1.21-alpine AS builder

WORKDIR /app

# 安装依赖
COPY go.mod go.sum ./
RUN go mod download

# 复制源代码
COPY . .

# 编译
RUN CGO_ENABLED=0 GOOS=linux go build -o /api ./cmd/server

# 运行阶段
FROM alpine:latest

RUN apk --no-cache add ca-certificates

WORKDIR /root/

COPY --from=builder /api ./

EXPOSE 8080

CMD ["./api"]
```

### Docker Compose

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: atonweb
      POSTGRES_USER: aton
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  api:
    build:
      context: ./api
      dockerfile: Dockerfile
    environment:
      DATABASE_URL: postgresql://aton:${DB_PASSWORD}@postgres:5432/atonweb?sslmode=disable
      JWT_SECRET: ${JWT_SECRET}
      OSS_REGION: ${OSS_REGION}
      OSS_BUCKET: ${OSS_BUCKET}
      OSS_ACCESS_KEY_ID: ${OSS_ACCESS_KEY_ID}
      OSS_ACCESS_KEY_SECRET: ${OSS_ACCESS_KEY_SECRET}
      OSS_ENDPOINT: ${OSS_ENDPOINT}
    ports:
      - "8080:8080"
    depends_on:
      - postgres

  web:
    build:
      context: ./web
      dockerfile: Dockerfile
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:8080
    ports:
      - "3000:3000"
    depends_on:
      - api

volumes:
  postgres_data:
```

---

## 依赖管理 (go.mod)

```go
module atonweb

go 1.21

require (
	github.com/gin-gonic/gin v1.10.0
	github.com/golang-jwt/jwt/v5 v5.2.0
	github.com/joho/godotenv v1.5.1
	github.com/aliyun/aliyun-oss-go-sdk v3.0.2+incompatible
	github.com/google/uuid v1.6.0
	golang.org/x/crypto v0.18.0
	gorm.io/driver/postgres v1.5.4
	gorm.io/gorm v1.25.5
)
```

---

## 开发指南

### 本地开发

1. **启动数据库**
```bash
docker-compose up -d postgres
```

2. **运行迁移**
```bash
migrate -database "postgres://aton:password@localhost:5432/atonweb?sslmode=disable" -path migrations up
```

3. **启动 API 服务**
```bash
cd api
go run cmd/server/main.go
```

4. **启动前端**
```bash
cd web
npm run dev
```

### API 测试

```bash
# 登录
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"aton","password":"password"}'

# 获取作品列表
curl -X GET http://localhost:8080/api/photos \
  -H "Authorization: Bearer <token>"

# 创建作品
curl -X POST http://localhost:8080/api/photos \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "黄山日出",
    "description": "清晨的第一缕阳光",
    "imageUrl": "https://cdn.example.com/photo.jpg",
    "category": "landscape",
    "tags": ["nature", "sunrise"]
  }'
```

---

## 后续扩展：WebSocket 实时游戏

Go 的并发模型非常适合 WebSocket：

```go
// 游戏服务器示例
package game

import (
	"github.com/gorilla/websocket"
	"sync"
)

type GameServer struct {
	rooms map[string]*GameRoom
	mu    sync.RWMutex
}

type GameRoom struct {
	id      string
	players map[*Player]*websocket.Conn
	mu      sync.RWMutex
}

type Player struct {
	id   string
	name string
}

// WebSocket 路由
r.GET("/ws/game/:roomId", gameHandler.HandleWebSocket)
```

这为你后续实现在线棋牌游戏打下了基础。

---

## 学习资源

- [Go 官方文档](https://go.dev/doc/)
- [Gin 框架文档](https://gin-gonic.com/docs/)
- [GORM 文档](https://gorm.io/docs/)
- [Go by Example](https://gobyexample.com/)
- [The Go Programming Language (书籍)](https://www.gopl.io/)

---

**文档版本**: v1.0
**最后更新**: 2025-12-15
