package domain

import (
	"time"

	"gorm.io/datatypes"
)

// ComponentPhoto represents the association between a component and a photo
type ComponentPhoto struct {
	ID            uint           `gorm:"primaryKey" json:"id"`
	ComponentName string         `gorm:"type:varchar(100);not null;uniqueIndex:uk_component_photo;index:idx_component_order" json:"componentName"`
	PhotoID       uint           `gorm:"not null;uniqueIndex:uk_component_photo" json:"photoId"`
	Order         int            `gorm:"not null;default:0;index:idx_component_order" json:"order"`
	Props         datatypes.JSON `gorm:"type:jsonb" json:"props"`
	CreatedAt     time.Time      `json:"createdAt"`
	UpdatedAt     time.Time      `json:"updatedAt"`

	Photo Photo `gorm:"->;foreignKey:PhotoID;references:ID" json:"photo,omitempty"`
}

// ComponentPhotoProps represents the JSON props structure
type ComponentPhotoProps struct {
	Caption string `json:"caption,omitempty"`
	Alt     string `json:"alt,omitempty"`
	Link    string `json:"link,omitempty"`
}

// Note: Component names are not validated on backend.
// Frontend components decide which name to use for fetching their photos.

// Request/Response structures
type AssignPhotoToComponentRequest struct {
	ComponentName string              `json:"componentName" binding:"required"`
	PhotoID       uint                `json:"photoId" binding:"required"`
	Order         int                 `json:"order"`
	Props         ComponentPhotoProps `json:"props"`
}

type UpdateComponentPhotoRequest struct {
	Order *int                 `json:"order"`
	Props *ComponentPhotoProps `json:"props"`
}

type ComponentPhotoResponse struct {
	ID            uint                `json:"id"`
	ComponentName string              `json:"componentName"`
	PhotoID       uint                `json:"photoId"`
	Order         int                 `json:"order"`
	Props         ComponentPhotoProps `json:"props"`
	Photo         *Photo              `json:"photo,omitempty"`
	CreatedAt     time.Time           `json:"createdAt"`
	UpdatedAt     time.Time           `json:"updatedAt"`
}
