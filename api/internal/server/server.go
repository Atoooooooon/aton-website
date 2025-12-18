package server

import (
	"context"
	"log"
	"net/http"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"

	"github.com/aton/atonWeb/api/internal/config"
	"github.com/aton/atonWeb/api/internal/delivery/http/handler"
	"github.com/aton/atonWeb/api/internal/delivery/http/middleware"
	"github.com/aton/atonWeb/api/internal/domain"
	"github.com/aton/atonWeb/api/internal/infrastructure/jwt"
	"github.com/aton/atonWeb/api/internal/repository"
	"github.com/aton/atonWeb/api/internal/usecase"
)

type Server struct {
	router *gin.Engine
	server *http.Server
	db     *gorm.DB
	cfg    config.Config
}

func New(cfg config.Config) *Server {
	// 连接数据库
	db, err := gorm.Open(postgres.Open(cfg.PostgresDSN), &gorm.Config{})
	if err != nil {
		log.Fatalf("Failed to connect database: %v", err)
	}

	// 自动迁移数据库
	if err := db.AutoMigrate(&domain.Photo{}, &domain.User{}); err != nil {
		log.Fatalf("Failed to migrate database: %v", err)
	}

	// 初始化 JWT Manager
	jwtManager := jwt.NewJWTManager(cfg.JWTSecret, 24*time.Hour)

	// 初始化认证服务
	authService := usecase.NewAuthService(db, jwtManager)
	authHandler := handler.NewAuthHandler(authService)

	// 初始化分层架构
	photoRepo := repository.NewPhotoRepository(db)
	photoService := usecase.NewPhotoService(photoRepo)
	photoHandler := handler.NewPhotoHandler(photoService)

	// 初始化存储服务
	storageService, err := usecase.NewStorageService(cfg)
	if err != nil {
		log.Printf("Warning: Storage service not available: %v", err)
	}
	var storageHandler *handler.StorageHandler
	if storageService != nil {
		storageHandler = handler.NewStorageHandler(storageService)
	}

	// 设置 Gin 模式
	if cfg.Env == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	router := gin.Default()

	// 配置 CORS
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000", "http://127.0.0.1:3000"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	// 基础路由
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":  "ok",
			"message": "Aton CMS API is running",
		})
	})

	// API v1 路由组
	v1 := router.Group("/api/v1")
	{
		// Auth 路由 (公开)
		auth := v1.Group("/auth")
		{
			auth.POST("/login", authHandler.Login)
			// Temporary route for creating initial admin user (remove in production)
			auth.POST("/create-user", authHandler.CreateUser)
		}

		// 需要认证的路由
		authMiddleware := middleware.AuthMiddleware(jwtManager)

		// User 路由 (需要认证)
		user := v1.Group("/user")
		user.Use(authMiddleware)
		{
			user.POST("/change-password", authHandler.ChangePassword)
		}

		// Photos 路由 (需要认证)
		photos := v1.Group("/photos")
		photos.Use(authMiddleware)
		{
			photos.GET("", photoHandler.List)
			photos.POST("", photoHandler.Create)
			photos.GET("/:id", photoHandler.GetByID)
			photos.PUT("/:id", photoHandler.Update)
			photos.DELETE("/:id", photoHandler.Delete)
			photos.POST("/reorder", photoHandler.BatchUpdateDisplayOrder)
		}

		// Storage 路由 (需要认证)
		if storageHandler != nil {
			storage := v1.Group("/storage")
			storage.Use(authMiddleware)
			{
				storage.POST("/upload-token", storageHandler.GenerateUploadToken)
			}
		}
	}

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

func (s *Server) Run() error {
	log.Printf("Starting server on %s", s.cfg.Addr())
	return s.server.ListenAndServe()
}

func (s *Server) Shutdown(ctx context.Context) error {
	log.Println("Shutting down server...")
	
	// 关闭数据库连接
	sqlDB, err := s.db.DB()
	if err == nil {
		sqlDB.Close()
	}
	
	return s.server.Shutdown(ctx)
}
