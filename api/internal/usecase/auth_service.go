package usecase

import (
	"errors"

	"gorm.io/gorm"

	"github.com/aton/atonWeb/api/internal/infrastructure/jwt"
	"github.com/aton/atonWeb/api/internal/domain"
)

var (
	ErrInvalidCredentials = errors.New("invalid username or password")
	ErrUserExists         = errors.New("user already exists")
)

type AuthService interface {
	Login(username, password string) (string, error)
	CreateUser(username, password, email string) (*domain.User, error)
}

type authService struct {
	db         *gorm.DB
	jwtManager *jwt.JWTManager
}

func NewAuthService(db *gorm.DB, jwtManager *jwt.JWTManager) AuthService {
	return &authService{
		db:         db,
		jwtManager: jwtManager,
	}
}

func (s *authService) Login(username, password string) (string, error) {
	var user domain.User
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

func (s *authService) CreateUser(username, password, email string) (*domain.User, error) {
	var existingUser domain.User
	if err := s.db.Where("username = ?", username).First(&existingUser).Error; err == nil {
		return nil, ErrUserExists
	}

	user := &domain.User{
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