package logger

import (
	"log/slog"
	"os"
)

var log *slog.Logger

func init() {
	// 创建 JSON 格式的结构化日志
	handler := slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.LevelInfo,
	})
	log = slog.New(handler)
}

// Info 信息级别日志
func Info(msg string, args ...any) {
	log.Info(msg, args...)
}

// Error 错误级别日志
func Error(msg string, args ...any) {
	log.Error(msg, args...)
}

// Warn 警告级别日志
func Warn(msg string, args ...any) {
	log.Warn(msg, args...)
}

// Debug 调试级别日志
func Debug(msg string, args ...any) {
	log.Debug(msg, args...)
}

// With 创建带有额外字段的日志器
func With(args ...any) *slog.Logger {
	return log.With(args...)
}