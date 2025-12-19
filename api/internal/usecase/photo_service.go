package usecase

import (
	"errors"
	"strings"

	"github.com/aton/atonWeb/api/internal/domain"
	"github.com/aton/atonWeb/api/internal/pkg/apperror"
	"github.com/aton/atonWeb/api/internal/repository"
)

var (
	ErrPhotoNotFound      = errors.New("photo not found")
	ErrPhotoTitleEmpty    = errors.New("photo title cannot be empty")
	ErrPhotoImageURLEmpty = errors.New("photo image URL cannot be empty")
	ErrNoFieldsToUpdate   = errors.New("no fields to update")
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
	if strings.TrimSpace(req.Title) == "" {
		return nil, apperror.BadRequest(ErrPhotoTitleEmpty)
	}
	if strings.TrimSpace(req.ImageURL) == "" {
		return nil, apperror.BadRequest(ErrPhotoImageURLEmpty)
	}

	photo := &domain.Photo{
		Title:        req.Title,
		Description:  req.Description,
		ImageURL:     req.ImageURL,
		ThumbnailURL: req.ThumbnailURL,
		Category:     req.Category,
		Location:     req.Location,
		IsFeatured:   req.IsFeatured,
		DisplayOrder: req.DisplayOrder,
		Status:       domain.PhotoStatusDraft,
	}

	if err := s.repo.Create(photo); err != nil {
		return nil, apperror.InternalError(err)
	}

	return photo, nil
}

func (s *photoService) GetByID(id uint) (*domain.Photo, error) {
	photo, err := s.repo.GetByID(id)
	if err != nil {
		return nil, apperror.NotFound(ErrPhotoNotFound)
	}
	return photo, nil
}

func (s *photoService) List(filters repository.PhotoFilters) ([]domain.Photo, int64, error) {
	photos, total, err := s.repo.List(filters)
	if err != nil {
		return nil, 0, apperror.InternalError(err)
	}
	return photos, total, nil
}

func (s *photoService) Update(id uint, req *domain.UpdatePhotoRequest) (*domain.Photo, error) {
	// Check at least one field to update
	if !req.HasUpdates() {
		return nil, apperror.BadRequest(ErrNoFieldsToUpdate)
	}

	// Get existing photo
	photo, err := s.repo.GetByID(id)
	if err != nil {
		return nil, apperror.NotFound(ErrPhotoNotFound)
	}

	// Validate before update
	if req.Title != nil && strings.TrimSpace(*req.Title) == "" {
		return nil, apperror.BadRequest(ErrPhotoTitleEmpty)
	}
	if req.ImageURL != nil && strings.TrimSpace(*req.ImageURL) == "" {
		return nil, apperror.BadRequest(ErrPhotoImageURLEmpty)
	}

	// Update fields using helper function
	updateStringField(&photo.Title, req.Title)
	updateStringField(&photo.Description, req.Description)
	updateStringField(&photo.ImageURL, req.ImageURL)
	updateStringField(&photo.ThumbnailURL, req.ThumbnailURL)
	updateStringField(&photo.Category, req.Category)
	updateStringField(&photo.Location, req.Location)

	if req.IsFeatured != nil {
		photo.IsFeatured = *req.IsFeatured
	}
	if req.DisplayOrder != nil {
		photo.DisplayOrder = *req.DisplayOrder
	}
	if req.Status != nil {
		photo.Status = *req.Status
	}

	if err := s.repo.Update(photo); err != nil {
		return nil, apperror.InternalError(err)
	}

	return photo, nil
}

func (s *photoService) Delete(id uint) error {
	// Delete directly and check affected rows
	err := s.repo.Delete(id)
	if err != nil {
		// Check if it's a not found error
		if err.Error() == "record not found" {
			return apperror.NotFound(ErrPhotoNotFound)
		}
		return apperror.InternalError(err)
	}
	return nil
}

func (s *photoService) UpdateDisplayOrder(id uint, order int) error {
	err := s.repo.UpdateDisplayOrder(id, order)
	if err != nil {
		return apperror.InternalError(err)
	}
	return nil
}

func (s *photoService) BatchUpdateDisplayOrder(orders []repository.DisplayOrderUpdate) error {
	err := s.repo.BatchUpdateDisplayOrder(orders)
	if err != nil {
		return apperror.InternalError(err)
	}
	return nil
}

// Helper function to update string pointer fields
func updateStringField(target *string, source *string) {
	if source != nil {
		*target = *source
	}
}
