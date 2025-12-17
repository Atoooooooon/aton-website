package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/aton/atonWeb/api/internal/usecase"
)

type StorageHandler struct {
	service usecase.StorageService
}

func NewStorageHandler(service usecase.StorageService) *StorageHandler {
	return &StorageHandler{service: service}
}

// GenerateUploadToken 生成上传凭证
func (h *StorageHandler) GenerateUploadToken(c *gin.Context) {
	var req struct {
		Filename    string `json:"filename" binding:"required"`
		ContentType string `json:"contentType"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	result, err := h.service.GeneratePresignedUploadURL(req.Filename, req.ContentType)
	if err != nil {
		if err == usecase.ErrInvalidFileExtension {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid file extension. Only images are allowed (jpg, png, gif, webp, bmp)"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, result)
}