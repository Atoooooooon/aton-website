package service

import (
	"errors"

	"gorm.io/gorm"

	"github.com/aton/atonWeb/api/internal/auth"
	"github.com/aton/atonWeb/api/internal/model"
)

var (
	ErrInvalidCredentials = errors.New("invalid username or password")
	ErrUserExists         = errors.New("user already exists")
)

type AuthService interface {
	Login(username, password string) (string, error)
	CreateUser(username, password, email string) (*model.User, error)
}

type authService struct {
	db         *gorm.DB
	jwtManager *auth.JWTManager
}

func NewAuthService(db *gorm.DB, jwtManager *auth.JWTManager) AuthService {
	return &authService{
		db:         db,
		jwtManager: jwtManager,
	}
}

func (s *authService) Login(username, password string) (string, error) {
	var user model.User
	if err := s.db.Where("username = ?", username).First(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return "", ErrInvalidCredentials
		}
		return "", err
	}

	if !user.CheckPassword(password) {
		return "", ErrInvalidCredentials
	}

	token, err := s.jwtManager.GenerateToken(user.ID, user.Username, user.Role)
	if err != nil {
		return "", err
	}

	return token, nil
}

func (s *authService) CreateUser(username, password, email string) (*model.User, error) {
	var existingUser model.User
	if err := s.db.Where("username = ?", username).First(&existingUser).Error; err == nil {
		return nil, ErrUserExists
	}

	user := &model.User{
		Username: username,
		Email:    email,
		Role:     "admin",
	}

	if err := user.HashPassword(password); err != nil {
		return nil, err
	}

	if err := s.db.Create(user).Error; err != nil {
		return nil, err
	}

	return user, nil
}