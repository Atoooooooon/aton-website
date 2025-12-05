package server

import (
	"context"
	"log/slog"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/aton/atonWeb/api/internal/config"
	"github.com/aton/atonWeb/api/internal/handlers"
)

type Server struct {
	cfg    config.Config
	engine *gin.Engine
	http   *http.Server
}

func New(cfg config.Config) *Server {
	engine := gin.New()
	engine.Use(gin.Logger(), gin.Recovery())

	api := engine.Group("/api")
	handlers.RegisterHealthRoutes(api)

	return &Server{
		cfg:    cfg,
		engine: engine,
		http: &http.Server{
			Addr:    cfg.Addr(),
			Handler: engine,
		},
	}
}

func (s *Server) Run() error {
	slog.Info("starting api server", "addr", s.cfg.Addr())
	return s.http.ListenAndServe()
}

func (s *Server) Shutdown(ctx context.Context) error {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()
	return s.http.Shutdown(ctx)
}
