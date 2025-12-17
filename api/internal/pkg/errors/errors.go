package errors

import (
	"fmt"
	"net/http"
)

// AppError 应用错误
type AppError struct {
	Code    int    // HTTP 状态码
	Message string // 用户可见的错误消息
	Err     error  // 内部错误（用于日志）
}

func (e *AppError) Error() string {
	if e.Err != nil {
		return fmt.Sprintf("%s: %v", e.Message, e.Err)
	}
	return e.Message
}

// New 创建新的应用错误
func New(code int, message string, err error) *AppError {
	return &AppError{
		Code:    code,
		Message: message,
		Err:     err,
	}
}

// 预定义错误
var (
	ErrBadRequest          = &AppError{Code: http.StatusBadRequest, Message: "Invalid request"}
	ErrUnauthorized        = &AppError{Code: http.StatusUnauthorized, Message: "Unauthorized"}
	ErrForbidden           = &AppError{Code: http.StatusForbidden, Message: "Forbidden"}
	ErrNotFound            = &AppError{Code: http.StatusNotFound, Message: "Resource not found"}
	ErrInternalServer      = &AppError{Code: http.StatusInternalServerError, Message: "Internal server error"}
	ErrInvalidCredentials  = &AppError{Code: http.StatusUnauthorized, Message: "Invalid username or password"}
	ErrUserExists          = &AppError{Code: http.StatusConflict, Message: "User already exists"}
	ErrPhotoNotFound       = &AppError{Code: http.StatusNotFound, Message: "Photo not found"}
	ErrPhotoTitleEmpty     = &AppError{Code: http.StatusBadRequest, Message: "Photo title cannot be empty"}
	ErrPhotoImageURLEmpty  = &AppError{Code: http.StatusBadRequest, Message: "Photo image URL cannot be empty"}
)

// Wrap 包装错误
func Wrap(err error, message string) *AppError {
	return &AppError{
		Code:    http.StatusInternalServerError,
		Message: message,
		Err:     err,
	}
}