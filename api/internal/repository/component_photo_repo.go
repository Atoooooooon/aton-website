package repository

import (
	"github.com/aton/atonWeb/api/internal/domain"
	"gorm.io/gorm"
)

type ComponentPhotoRepository interface {
	// Assign a photo to a component
	Assign(componentPhoto *domain.ComponentPhoto) error

	// Update component photo association
	Update(id uint, componentPhoto *domain.ComponentPhoto) error

	// Remove photo from component
	Remove(id uint) error

	// Get component photos by component name
	GetByComponentName(componentName string) ([]domain.ComponentPhoto, error)

	// Get component photos by photo ID
	GetByPhotoID(photoID uint) ([]domain.ComponentPhoto, error)

	// Get single component photo by ID
	GetByID(id uint) (*domain.ComponentPhoto, error)

	// Check if photo is already assigned to component
	Exists(componentName string, photoID uint) (bool, error)
}

type componentPhotoRepository struct {
	db *gorm.DB
}

func NewComponentPhotoRepository(db *gorm.DB) ComponentPhotoRepository {
	return &componentPhotoRepository{db: db}
}

func (r *componentPhotoRepository) Assign(componentPhoto *domain.ComponentPhoto) error {
	return r.db.Create(componentPhoto).Error
}

func (r *componentPhotoRepository) Update(id uint, componentPhoto *domain.ComponentPhoto) error {
	return r.db.Model(&domain.ComponentPhoto{}).
		Where("id = ?", id).
		Updates(componentPhoto).Error
}

func (r *componentPhotoRepository) Remove(id uint) error {
	return r.db.Delete(&domain.ComponentPhoto{}, id).Error
}

func (r *componentPhotoRepository) GetByComponentName(componentName string) ([]domain.ComponentPhoto, error) {
	var componentPhotos []domain.ComponentPhoto
	err := r.db.Preload("Photo").
		Where("component_name = ?", componentName).
		Order("\"order\" ASC").
		Find(&componentPhotos).Error
	return componentPhotos, err
}

func (r *componentPhotoRepository) GetByPhotoID(photoID uint) ([]domain.ComponentPhoto, error) {
	var componentPhotos []domain.ComponentPhoto
	err := r.db.Where("photo_id = ?", photoID).
		Find(&componentPhotos).Error
	return componentPhotos, err
}

func (r *componentPhotoRepository) GetByID(id uint) (*domain.ComponentPhoto, error) {
	var componentPhoto domain.ComponentPhoto
	err := r.db.Preload("Photo").First(&componentPhoto, id).Error
	if err != nil {
		return nil, err
	}
	return &componentPhoto, nil
}

func (r *componentPhotoRepository) Exists(componentName string, photoID uint) (bool, error) {
	var count int64
	err := r.db.Model(&domain.ComponentPhoto{}).
		Where("component_name = ? AND photo_id = ?", componentName, photoID).
		Count(&count).Error
	return count > 0, err
}
