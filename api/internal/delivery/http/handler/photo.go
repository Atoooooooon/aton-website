package handler

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"github.com/aton/atonWeb/api/internal/domain"
	"github.com/aton/atonWeb/api/internal/repository"
	"github.com/aton/atonWeb/api/internal/usecase"
)

type PhotoHandler struct {
	service usecase.PhotoService
}

func NewPhotoHandler(service usecase.PhotoService) *PhotoHandler {
	return &PhotoHandler{service: service}
}

// List returns all photos with optional filters
func (h *PhotoHandler) List(c *gin.Context) {
	filters := repository.PhotoFilters{
		Status:   c.Query("status"),
		Category: c.Query("category"),
		OrderBy:  c.DefaultQuery("order_by", "display_order ASC"),
	}

	// Parse pagination
	if limit := c.Query("limit"); limit != "" {
		if l, err := strconv.Atoi(limit); err == nil {
			filters.Limit = l
		}
	}
	if offset := c.Query("offset"); offset != "" {
		if o, err := strconv.Atoi(offset); err == nil {
			filters.Offset = o
		}
	}

	// Parse featured filter
	if featured := c.Query("featured"); featured != "" {
		if f, err := strconv.ParseBool(featured); err == nil {
			filters.IsFeatured = &f
		}
	}

	photos, total, err := h.service.List(filters)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":  photos,
		"total": total,
	})
}

// GetByID returns a single photo by ID
func (h *PhotoHandler) GetByID(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid photo ID"})
		return
	}

	photo, err := h.service.GetByID(uint(id))
	if err != nil {
		if err == usecase.ErrPhotoNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Photo not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, photo)
}

// Create creates a new photo
func (h *PhotoHandler) Create(c *gin.Context) {
	var req domain.CreatePhotoRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	photo, err := h.service.Create(&req)
	if err != nil {
		if err == usecase.ErrPhotoTitleEmpty || err == usecase.ErrPhotoImageURLEmpty {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, photo)
}

// Update updates an existing photo
func (h *PhotoHandler) Update(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid photo ID"})
		return
	}

	var req domain.UpdatePhotoRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	photo, err := h.service.Update(uint(id), &req)
	if err != nil {
		if err == usecase.ErrPhotoNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Photo not found"})
			return
		}
		if err == usecase.ErrPhotoTitleEmpty || err == usecase.ErrPhotoImageURLEmpty {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, photo)
}

// Delete deletes a photo
func (h *PhotoHandler) Delete(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid photo ID"})
		return
	}

	if err := h.service.Delete(uint(id)); err != nil {
		if err == usecase.ErrPhotoNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Photo not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Photo deleted successfully"})
}

// BatchUpdateDisplayOrder updates display order for multiple photos
func (h *PhotoHandler) BatchUpdateDisplayOrder(c *gin.Context) {
	var req struct {
		Updates []repository.DisplayOrderUpdate `json:"updates" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.service.BatchUpdateDisplayOrder(req.Updates); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Display order updated successfully"})
}
