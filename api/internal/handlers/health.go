package handlers

import "github.com/gin-gonic/gin"

func RegisterHealthRoutes(rg *gin.RouterGroup) {
	rg.GET("/healthz", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status": "ok",
		})
	})
}
