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
	if err := db.AutoMigrate(&domain.Photo{}, &domain.User{}, &domain.ComponentPhoto{}); err != nil {
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

	// 初始化组件照片服务
	componentPhotoRepo := repository.NewComponentPhotoRepository(db)
	componentPhotoService := usecase.NewComponentPhotoService(componentPhotoRepo)
	componentPhotoHandler := handler.NewComponentPhotoHandler(componentPhotoService)

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
		AllowOrigins:     cfg.CORSOrigins,
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
			// Only allow user creation in non-production environments
			if cfg.Env != "production" {
				auth.POST("/create-user", authHandler.CreateUser)
			}
		}

		// 需要认证的路由
		authMiddleware := middleware.AuthMiddleware(jwtManager)

		// User 路由 (需要认证)
		user := v1.Group("/user")
		user.Use(authMiddleware)
		{
			user.POST("/change-password", authHandler.ChangePassword)
		}

		// Photos 路由
		photos := v1.Group("/photos")
		{
			// Public routes - no auth required
			photos.GET("/published", photoHandler.ListPublished) // Public: only published photos for photo wall
			photos.GET("/:id", photoHandler.GetByID)             // Public: for photo detail

			// Protected routes - require auth (admin only)
			photosAuth := photos.Group("")
			photosAuth.Use(authMiddleware)
			{
				photosAuth.GET("", photoHandler.List) // Admin: all photos with filters
				photosAuth.POST("", photoHandler.Create)
				photosAuth.PUT("/:id", photoHandler.Update)
				photosAuth.DELETE("/:id", photoHandler.Delete)
				photosAuth.POST("/reorder", photoHandler.BatchUpdateDisplayOrder)
				photosAuth.GET("/:id/components", componentPhotoHandler.GetComponentsByPhoto)
			}
		}

		// Component Photos 路由 (需要认证)
		componentPhotos := v1.Group("/component-photos")
		componentPhotos.Use(authMiddleware)
		{
			componentPhotos.POST("", componentPhotoHandler.AssignPhotoToComponent)
			componentPhotos.PUT("/:id", componentPhotoHandler.UpdateComponentPhoto)
			componentPhotos.DELETE("/:id", componentPhotoHandler.RemovePhotoFromComponent)
		}

		// Components 路由 (public for photo fetching, auth for admin)
		components := v1.Group("/components")
		{
			components.GET("/:name/photos", componentPhotoHandler.GetPhotosByComponent)
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
