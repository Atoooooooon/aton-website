package response

import (
	"net/http"

	"github.com/aton/atonWeb/api/internal/pkg/apperror"
	"github.com/gin-gonic/gin"
)

// Success sends a successful JSON response with data
func Success(c *gin.Context, data interface{}) {
	c.JSON(http.StatusOK, data)
}

// Created sends a 201 Created response
func Created(c *gin.Context, data interface{}) {
	c.JSON(http.StatusCreated, data)
}

// Message sends a simple message response
func Message(c *gin.Context, statusCode int, message string) {
	c.JSON(statusCode, gin.H{"message": message})
}

// Error automatically handles error responses based on error type
// If error is AppError, use its status code; otherwise return 500
func Error(c *gin.Context, err error) {
	if err == nil {
		return
	}

	if appErr, ok := apperror.IsAppError(err); ok {
		c.JSON(appErr.StatusCode, gin.H{"error": appErr.Error()})
		return
	}

	// Unknown error - return 500 with generic message
	c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
}