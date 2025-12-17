package main

import (
	"fmt"
	"log"
	"os"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"

	"github.com/aton/atonWeb/api/internal/config"
	"github.com/aton/atonWeb/api/internal/model"
)

func main() {
	cfg := config.Load()

	// Connect to database
	db, err := gorm.Open(postgres.Open(cfg.PostgresDSN), &gorm.Config{})
	if err != nil {
		log.Fatalf("Failed to connect database: %v", err)
	}

	// Get username and password from args
	if len(os.Args) < 3 {
		fmt.Println("Usage: create-user <username> <password> [email]")
		os.Exit(1)
	}

	username := os.Args[1]
	password := os.Args[2]
	email := ""
	if len(os.Args) >= 4 {
		email = os.Args[3]
	}

	// Check if user exists
	var existingUser model.User
	if err := db.Where("username = ?", username).First(&existingUser).Error; err == nil {
		log.Fatalf("User '%s' already exists", username)
	}

	// Create user
	user := &model.User{
		Username: username,
		Email:    email,
		Role:     "admin",
	}

	if err := user.HashPassword(password); err != nil {
		log.Fatalf("Failed to hash password: %v", err)
	}

	if err := db.Create(user).Error; err != nil {
		log.Fatalf("Failed to create user: %v", err)
	}

	fmt.Printf("✅ Admin user '%s' created successfully!\n", username)
}