package repository

import (
	"gorm.io/gorm"

	"github.com/aton/atonWeb/api/internal/domain"
)

type PhotoRepository interface {
	Create(photo *domain.Photo) error
	GetByID(id uint) (*domain.Photo, error)
	List(filters PhotoFilters) ([]domain.Photo, int64, error)
	Update(photo *domain.Photo) error
	Delete(id uint) error
	UpdateDisplayOrder(id uint, order int) error
	BatchUpdateDisplayOrder(orders []DisplayOrderUpdate) error
}

type PhotoFilters struct {
	Status     string
	Category   string
	IsFeatured *bool
	Limit      int
	Offset     int
	OrderBy    string
}

type DisplayOrderUpdate struct {
	ID    uint
	Order int
}

type photoRepo struct {
	db *gorm.DB
}

func NewPhotoRepository(db *gorm.DB) PhotoRepository {
	return &photoRepo{db: db}
}

func (r *photoRepo) Create(photo *domain.Photo) error {
	return r.db.Create(photo).Error
}

func (r *photoRepo) GetByID(id uint) (*domain.Photo, error) {
	var photo domain.Photo
	err := r.db.First(&photo, id).Error
	if err != nil {
		return nil, err
	}
	return &photo, nil
}

func (r *photoRepo) List(filters PhotoFilters) ([]domain.Photo, int64, error) {
	var photos []domain.Photo
	var total int64

	query := r.db.Model(&domain.Photo{})

	// Apply filters
	if filters.Status != "" {
		query = query.Where("status = ?", filters.Status)
	}
	if filters.Category != "" {
		query = query.Where("category = ?", filters.Category)
	}
	if filters.IsFeatured != nil {
		query = query.Where("is_featured = ?", *filters.IsFeatured)
	}

	// Count total
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Apply ordering
	orderBy := "display_order ASC"
	if filters.OrderBy != "" {
		orderBy = filters.OrderBy
	}
	query = query.Order(orderBy)

	// Apply pagination
	if filters.Limit > 0 {
		query = query.Limit(filters.Limit)
	}
	if filters.Offset > 0 {
		query = query.Offset(filters.Offset)
	}

	err := query.Find(&photos).Error
	return photos, total, err
}

func (r *photoRepo) Update(photo *domain.Photo) error {
	return r.db.Save(photo).Error
}

func (r *photoRepo) Delete(id uint) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		// First delete all component_photos associations
		if err := tx.Where("photo_id = ?", id).Delete(&domain.ComponentPhoto{}).Error; err != nil {
			return err
		}
		// Then delete the photo
		return tx.Delete(&domain.Photo{}, id).Error
	})
}

func (r *photoRepo) UpdateDisplayOrder(id uint, order int) error {
	return r.db.Model(&domain.Photo{}).Where("id = ?", id).Update("display_order", order).Error
}

func (r *photoRepo) BatchUpdateDisplayOrder(orders []DisplayOrderUpdate) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		for _, update := range orders {
			if err := tx.Model(&domain.Photo{}).Where("id = ?", update.ID).Update("display_order", update.Order).Error; err != nil {
				return err
			}
		}
		return nil
	})
}
