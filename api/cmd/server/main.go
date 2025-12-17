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
	// 加载 .env 文件
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	cfg := config.Load()
	srv := server.New(cfg)

	go func() {
		if err := srv.Run(); err != nil {
			log.Fatalf("server exited: %v", err)
		}
	}()

	shutdown := make(chan os.Signal, 1)
	signal.Notify(shutdown, syscall.SIGINT, syscall.SIGTERM)
	<-shutdown

	if err := srv.Shutdown(context.Background()); err != nil {
		log.Printf("graceful shutdown failed: %v", err)
	}
}
