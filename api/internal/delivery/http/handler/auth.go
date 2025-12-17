package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/aton/atonWeb/api/internal/usecase"
)

type AuthHandler struct {
	service usecase.AuthService
}

func NewAuthHandler(service usecase.AuthService) *AuthHandler {
	return &AuthHandler{
		service: service,
	}
}

type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type LoginResponse struct {
	Token string `json:"token"`
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	token, err := h.service.Login(req.Username, req.Password)
	if err != nil {
		if err == usecase.ErrInvalidCredentials {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid username or password"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
		return
	}

	c.JSON(http.StatusOK, LoginResponse{Token: token})
}