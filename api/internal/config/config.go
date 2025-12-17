package config

import (
	"fmt"
	"os"
)

type Config struct {
	Env         string
	AppHost     string
	AppPort     string
	PostgresDSN string
	JWTSecret   string

	// MinIO/OSS 配置
	OSSEndpoint        string
	OSSBucket          string
	OSSAccessKeyID     string
	OSSAccessKeySecret string
	OSSUseSSL          bool
}

func Load() Config {
	return Config{
		Env:                getEnv("ENV", "development"),
		AppHost:            getEnv("API_HOST", "0.0.0.0"),
		AppPort:            getEnv("API_PORT", "8080"),
		PostgresDSN:        buildPostgresDSN(),
		JWTSecret:          getEnv("JWT_SECRET", "change-me-in-production"),
		OSSEndpoint:        getEnv("OSS_ENDPOINT", ""),
		OSSBucket:          getEnv("OSS_BUCKET", ""),
		OSSAccessKeyID:     getEnv("OSS_ACCESS_KEY_ID", ""),
		OSSAccessKeySecret: getEnv("OSS_ACCESS_KEY_SECRET", ""),
		OSSUseSSL:          getEnv("OSS_USE_SSL", "false") == "true",
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
	user := getEnv("POSTGRES_USER", "aton")
	password := getEnv("POSTGRES_PASSWORD", "")
	dbName := getEnv("POSTGRES_DB", "atonweb")
	sslMode := getEnv("POSTGRES_SSL_MODE", "disable")
	return fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=%s", host, port, user, password, dbName, sslMode)
}
