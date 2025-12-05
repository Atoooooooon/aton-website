package config

import (
	"fmt"
	"os"
)

type Config struct {
	AppHost     string
	AppPort     string
	PostgresDSN string
	RedisAddr   string
}

func Load() Config {
	return Config{
		AppHost:     getEnv("API_HOST", "0.0.0.0"),
		AppPort:     getEnv("API_PORT", "8080"),
		PostgresDSN: buildPostgresDSN(),
		RedisAddr:   getEnv("REDIS_ADDR", "redis:6379"),
	}
}

func (c Config) Addr() string {
	return fmt.Sprintf("%s:%s", c.AppHost, c.AppPort)
}

func getEnv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}

func buildPostgresDSN() string {
	host := getEnv("POSTGRES_HOST", "db")
	port := getEnv("POSTGRES_PORT", "5432")
	user := getEnv("POSTGRES_USER", "webapp")
	password := getEnv("POSTGRES_PASSWORD", "webapp")
	dbName := getEnv("POSTGRES_DB", "webapp")
	sslMode := getEnv("POSTGRES_SSL_MODE", "disable")
	return fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=%s", host, port, user, password, dbName, sslMode)
}
