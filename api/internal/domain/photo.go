package domain

import (
	"time"
)

// PhotoStatus represents the status of a photo
type PhotoStatus string

const (
	PhotoStatusDraft     PhotoStatus = "draft"
	PhotoStatusPublished PhotoStatus = "published"
)

type Photo struct {
	ID           uint        `gorm:"primaryKey" json:"id"`
	Title        string      `gorm:"size:200;not null" json:"title"`
	Description  string      `gorm:"type:text" json:"description"`
	ImageURL     string      `gorm:"size:500;not null" json:"imageUrl"`
	ThumbnailURL string      `gorm:"size:500" json:"thumbnailUrl"`
	Category     string      `gorm:"size:50" json:"category"`
	Location     string      `gorm:"size:200" json:"location"`
	IsFeatured   bool        `gorm:"default:false" json:"isFeatured"`
	DisplayOrder int         `gorm:"default:0;index" json:"displayOrder"`
	Status       PhotoStatus `gorm:"size:20;default:'draft';index;check:status IN ('draft','published')" json:"status"`
	CreatedAt    time.Time   `json:"createdAt"`
	UpdatedAt    time.Time   `json:"updatedAt"`
}

type CreatePhotoRequest struct {
	Title        string `json:"title" binding:"required,min=1,max=200"`
	Description  string `json:"description"`
	ImageURL     string `json:"imageUrl" binding:"required"`
	ThumbnailURL string `json:"thumbnailUrl"`
	Category     string `json:"category"`
	Location     string `json:"location"`
	IsFeatured   bool   `json:"isFeatured"`
	DisplayOrder int    `json:"displayOrder"`
}

type UpdatePhotoRequest struct {
	Title        *string      `json:"title"`
	Description  *string      `json:"description"`
	ImageURL     *string      `json:"imageUrl"`
	ThumbnailURL *string      `json:"thumbnailUrl"`
	Category     *string      `json:"category"`
	Location     *string      `json:"location"`
	IsFeatured   *bool        `json:"isFeatured"`
	DisplayOrder *int         `json:"displayOrder"`
	Status       *PhotoStatus `json:"status"`
}

// HasUpdates checks if the update request has at least one field to update
func (r *UpdatePhotoRequest) HasUpdates() bool {
	return r.Title != nil || r.Description != nil || r.ImageURL != nil ||
		r.ThumbnailURL != nil || r.Category != nil || r.Location != nil ||
		r.IsFeatured != nil || r.DisplayOrder != nil || r.Status != nil
}

