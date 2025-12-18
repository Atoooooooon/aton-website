package handler

import (
	"net/http"
	"strconv"

	"github.com/aton/atonWeb/api/internal/domain"
	"github.com/aton/atonWeb/api/internal/usecase"
	"github.com/gin-gonic/gin"
)

type ComponentPhotoHandler struct {
	service usecase.ComponentPhotoService
}

func NewComponentPhotoHandler(service usecase.ComponentPhotoService) *ComponentPhotoHandler {
	return &ComponentPhotoHandler{service: service}
}

// AssignPhotoToComponent assigns a photo to a component
// POST /api/v1/component-photos
func (h *ComponentPhotoHandler) AssignPhotoToComponent(c *gin.Context) {
	var req domain.AssignPhotoToComponentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.service.AssignPhotoToComponent(req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Photo assigned to component successfully"})
}

// UpdateComponentPhoto updates a component photo
// PUT /api/v1/component-photos/:id
func (h *ComponentPhotoHandler) UpdateComponentPhoto(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	var req domain.UpdateComponentPhotoRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.service.UpdateComponentPhoto(uint(id), req); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Component photo updated successfully"})
}

// RemovePhotoFromComponent removes a photo from a component
// DELETE /api/v1/component-photos/:id
func (h *ComponentPhotoHandler) RemovePhotoFromComponent(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	if err := h.service.RemovePhotoFromComponent(uint(id)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Photo removed from component successfully"})
}

// GetPhotosByComponent gets all photos for a specific component
// GET /api/v1/components/:name/photos
func (h *ComponentPhotoHandler) GetPhotosByComponent(c *gin.Context) {
	componentName := c.Param("name")

	photos, err := h.service.GetPhotosByComponent(componentName)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": photos})
}

// GetComponentsByPhoto gets all component assignments for a specific photo
// GET /api/v1/photos/:id/components
func (h *ComponentPhotoHandler) GetComponentsByPhoto(c *gin.Context) {
	photoID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid photo ID"})
		return
	}

	components, err := h.service.GetComponentsByPhoto(uint(photoID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": components})
}
