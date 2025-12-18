package usecase

import (
	"encoding/json"
	"errors"

	"github.com/aton/atonWeb/api/internal/domain"
	"github.com/aton/atonWeb/api/internal/repository"
)

type ComponentPhotoService interface {
	// Assign photo to component
	AssignPhotoToComponent(req domain.AssignPhotoToComponentRequest) error

	// Update component photo
	UpdateComponentPhoto(id uint, req domain.UpdateComponentPhotoRequest) error

	// Remove photo from component
	RemovePhotoFromComponent(id uint) error

	// Get photos by component name
	GetPhotosByComponent(componentName string) ([]domain.ComponentPhotoResponse, error)

	// Get component assignments by photo ID
	GetComponentsByPhoto(photoID uint) ([]domain.ComponentPhotoResponse, error)
}

type componentPhotoService struct {
	repo repository.ComponentPhotoRepository
}

func NewComponentPhotoService(repo repository.ComponentPhotoRepository) ComponentPhotoService {
	return &componentPhotoService{repo: repo}
}

func (s *componentPhotoService) AssignPhotoToComponent(req domain.AssignPhotoToComponentRequest) error {
	// Check if already exists
	exists, err := s.repo.Exists(req.ComponentName, req.PhotoID)
	if err != nil {
		return err
	}
	if exists {
		return errors.New("photo is already assigned to this component")
	}

	// Marshal props to JSON
	propsJSON, err := json.Marshal(req.Props)
	if err != nil {
		return err
	}

	componentPhoto := &domain.ComponentPhoto{
		ComponentName: req.ComponentName,
		PhotoID:       req.PhotoID,
		Order:         req.Order,
		Props:         propsJSON,
	}

	return s.repo.Assign(componentPhoto)
}

func (s *componentPhotoService) UpdateComponentPhoto(id uint, req domain.UpdateComponentPhotoRequest) error {
	// Get existing record
	existing, err := s.repo.GetByID(id)
	if err != nil {
		return err
	}

	// Prepare update
	updateData := &domain.ComponentPhoto{}
	if req.Order != nil {
		updateData.Order = *req.Order
	}
	if req.Props != nil {
		propsJSON, err := json.Marshal(req.Props)
		if err != nil {
			return err
		}
		updateData.Props = propsJSON
	}

	_ = existing // avoid unused warning
	return s.repo.Update(id, updateData)
}

func (s *componentPhotoService) RemovePhotoFromComponent(id uint) error {
	return s.repo.Remove(id)
}

func (s *componentPhotoService) GetPhotosByComponent(componentName string) ([]domain.ComponentPhotoResponse, error) {
	componentPhotos, err := s.repo.GetByComponentName(componentName)
	if err != nil {
		return nil, err
	}

	return s.toResponseList(componentPhotos), nil
}

func (s *componentPhotoService) GetComponentsByPhoto(photoID uint) ([]domain.ComponentPhotoResponse, error) {
	componentPhotos, err := s.repo.GetByPhotoID(photoID)
	if err != nil {
		return nil, err
	}

	return s.toResponseList(componentPhotos), nil
}

// Helper methods

func (s *componentPhotoService) toResponseList(componentPhotos []domain.ComponentPhoto) []domain.ComponentPhotoResponse {
	responses := make([]domain.ComponentPhotoResponse, len(componentPhotos))
	for i, cp := range componentPhotos {
		var props domain.ComponentPhotoProps
		if len(cp.Props) > 0 {
			_ = json.Unmarshal(cp.Props, &props)
		}

		responses[i] = domain.ComponentPhotoResponse{
			ID:            cp.ID,
			ComponentName: cp.ComponentName,
			PhotoID:       cp.PhotoID,
			Order:         cp.Order,
			Props:         props,
			CreatedAt:     cp.CreatedAt,
			UpdatedAt:     cp.UpdatedAt,
		}

		if cp.Photo.ID != 0 {
			responses[i].Photo = &cp.Photo
		}
	}
	return responses
}
