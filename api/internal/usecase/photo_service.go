package usecase

import (
	"errors"
	"strings"

	"github.com/aton/atonWeb/api/internal/domain"
	"github.com/aton/atonWeb/api/internal/repository"
)

var (
	ErrPhotoNotFound     = errors.New("photo not found")
	ErrInvalidInput      = errors.New("invalid input")
	ErrPhotoTitleEmpty   = errors.New("photo title cannot be empty")
	ErrPhotoImageURLEmpty = errors.New("photo image URL cannot be empty")
)

type PhotoService interface {
	Create(req *domain.CreatePhotoRequest) (*domain.Photo, error)
	GetByID(id uint) (*domain.Photo, error)
	List(filters repository.PhotoFilters) ([]domain.Photo, int64, error)
	Update(id uint, req *domain.UpdatePhotoRequest) (*domain.Photo, error)
	Delete(id uint) error
	UpdateDisplayOrder(id uint, order int) error
	BatchUpdateDisplayOrder(orders []repository.DisplayOrderUpdate) error
}

type photoService struct {
	repo repository.PhotoRepository
}

func NewPhotoService(repo repository.PhotoRepository) PhotoService {
	return &photoService{repo: repo}
}

func (s *photoService) Create(req *domain.CreatePhotoRequest) (*domain.Photo, error) {
	// Validate input
	if err := s.validateCreateRequest(req); err != nil {
		return nil, err
	}

	photo := &domain.Photo{
		Title:        strings.TrimSpace(req.Title),
		Description:  strings.TrimSpace(req.Description),
		ImageURL:     strings.TrimSpace(req.ImageURL),
		ThumbnailURL: strings.TrimSpace(req.ThumbnailURL),
		Category:     strings.TrimSpace(req.Category),
		Location:     strings.TrimSpace(req.Location),
		IsFeatured:   req.IsFeatured,
		Status:       "draft",
	}

	if err := s.repo.Create(photo); err != nil {
		return nil, err
	}

	return photo, nil
}

func (s *photoService) GetByID(id uint) (*domain.Photo, error) {
	photo, err := s.repo.GetByID(id)
	if err != nil {
		return nil, ErrPhotoNotFound
	}
	return photo, nil
}

func (s *photoService) List(filters repository.PhotoFilters) ([]domain.Photo, int64, error) {
	return s.repo.List(filters)
}

func (s *photoService) Update(id uint, req *domain.UpdatePhotoRequest) (*domain.Photo, error) {
	// Get existing photo
	photo, err := s.repo.GetByID(id)
	if err != nil {
		return nil, ErrPhotoNotFound
	}

	// Validate input
	if err := s.validateUpdateRequest(req); err != nil {
		return nil, err
	}

	// Update fields
	if req.Title != nil {
		photo.Title = strings.TrimSpace(*req.Title)
	}
	if req.Description != nil {
		photo.Description = strings.TrimSpace(*req.Description)
	}
	if req.ImageURL != nil {
		photo.ImageURL = strings.TrimSpace(*req.ImageURL)
	}
	if req.ThumbnailURL != nil {
		photo.ThumbnailURL = strings.TrimSpace(*req.ThumbnailURL)
	}
	if req.Category != nil {
		photo.Category = strings.TrimSpace(*req.Category)
	}
	if req.Location != nil {
		photo.Location = strings.TrimSpace(*req.Location)
	}
	if req.IsFeatured != nil {
		photo.IsFeatured = *req.IsFeatured
	}
	if req.Status != nil {
		photo.Status = strings.TrimSpace(*req.Status)
	}

	if err := s.repo.Update(photo); err != nil {
		return nil, err
	}

	return photo, nil
}

func (s *photoService) Delete(id uint) error {
	// Check if photo exists
	_, err := s.repo.GetByID(id)
	if err != nil {
		return ErrPhotoNotFound
	}

	return s.repo.Delete(id)
}

func (s *photoService) UpdateDisplayOrder(id uint, order int) error {
	// Check if photo exists
	_, err := s.repo.GetByID(id)
	if err != nil {
		return ErrPhotoNotFound
	}

	return s.repo.UpdateDisplayOrder(id, order)
}

func (s *photoService) BatchUpdateDisplayOrder(orders []repository.DisplayOrderUpdate) error {
	return s.repo.BatchUpdateDisplayOrder(orders)
}

func (s *photoService) validateCreateRequest(req *domain.CreatePhotoRequest) error {
	if strings.TrimSpace(req.Title) == "" {
		return ErrPhotoTitleEmpty
	}
	if strings.TrimSpace(req.ImageURL) == "" {
		return ErrPhotoImageURLEmpty
	}
	return nil
}

func (s *photoService) validateUpdateRequest(req *domain.UpdatePhotoRequest) error {
	if req.Title != nil && strings.TrimSpace(*req.Title) == "" {
		return ErrPhotoTitleEmpty
	}
	if req.ImageURL != nil && strings.TrimSpace(*req.ImageURL) == "" {
		return ErrPhotoImageURLEmpty
	}
	return nil
}
