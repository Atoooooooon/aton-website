package apperror

import (
	"errors"
	"net/http"
)

// AppError represents an application error with HTTP status code
type AppError struct {
	Err        error
	StatusCode int
	Message    string
}

func (e *AppError) Error() string {
	if e.Message != "" {
		return e.Message
	}
	return e.Err.Error()
}

// Constructor functions for common errors
func BadRequest(err error) *AppError {
	return &AppError{
		Err:        err,
		StatusCode: http.StatusBadRequest,
	}
}

func NotFound(err error) *AppError {
	return &AppError{
		Err:        err,
		StatusCode: http.StatusNotFound,
	}
}

func Unauthorized(err error) *AppError {
	return &AppError{
		Err:        err,
		StatusCode: http.StatusUnauthorized,
	}
}

func InternalError(err error) *AppError {
	return &AppError{
		Err:        err,
		StatusCode: http.StatusInternalServerError,
		Message:    "Internal server error", // Don't expose internal details
	}
}

func Conflict(err error) *AppError {
	return &AppError{
		Err:        err,
		StatusCode: http.StatusConflict,
	}
}

// IsAppError checks if an error is an AppError
func IsAppError(err error) (*AppError, bool) {
	var appErr *AppError
	if errors.As(err, &appErr) {
		return appErr, true
	}
	return nil, false
}