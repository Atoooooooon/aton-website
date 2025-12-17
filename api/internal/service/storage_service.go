package service

import (
	"context"
	"errors"
	"fmt"
	"path/filepath"
	"time"

	"github.com/google/uuid"
	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"

	"github.com/aton/atonWeb/api/internal/config"
)

var (
	ErrStorageNotConfigured = errors.New("storage service not configured")
	ErrInvalidFileExtension = errors.New("invalid file extension")
)

type StorageService interface {
	GeneratePresignedUploadURL(filename string, contentType string) (*PresignedUploadResponse, error)
	GetPublicURL(objectName string) string
}

type PresignedUploadResponse struct {
	UploadURL string `json:"uploadUrl"`
	FileURL   string `json:"fileUrl"`
	ObjectKey string `json:"objectKey"`
	ExpiresIn int    `json:"expiresIn"`
}

type storageService struct {
	client   *minio.Client
	bucket   string
	endpoint string
	useSSL   bool
}

func NewStorageService(cfg config.Config) (StorageService, error) {
	if cfg.OSSEndpoint == "" || cfg.OSSBucket == "" {
		return nil, ErrStorageNotConfigured
	}

	client, err := minio.New(cfg.OSSEndpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(cfg.OSSAccessKeyID, cfg.OSSAccessKeySecret, ""),
		Secure: cfg.OSSUseSSL,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create minio client: %w", err)
	}

	// 检查 bucket 是否存在
	ctx := context.Background()
	exists, err := client.BucketExists(ctx, cfg.OSSBucket)
	if err != nil {
		return nil, fmt.Errorf("failed to check bucket existence: %w", err)
	}
	if !exists {
		return nil, fmt.Errorf("bucket %s does not exist", cfg.OSSBucket)
	}

	return &storageService{
		client:   client,
		bucket:   cfg.OSSBucket,
		endpoint: cfg.OSSEndpoint,
		useSSL:   cfg.OSSUseSSL,
	}, nil
}

// GeneratePresignedUploadURL 生成预签名上传 URL
func (s *storageService) GeneratePresignedUploadURL(filename string, contentType string) (*PresignedUploadResponse, error) {
	// 生成唯一的对象名
	ext := filepath.Ext(filename)
	if !isValidImageExtension(ext) {
		return nil, ErrInvalidFileExtension
	}

	// 使用 UUID + 原始扩展名
	objectKey := fmt.Sprintf("photos/%s/%s%s",
		time.Now().Format("2006/01"),  // 按年月分目录
		uuid.New().String(),
		ext,
	)

	// 生成预签名 URL (有效期 15 分钟)
	expiresIn := 15 * time.Minute
	presignedURL, err := s.client.PresignedPutObject(
		context.Background(),
		s.bucket,
		objectKey,
		expiresIn,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to generate presigned URL: %w", err)
	}

	return &PresignedUploadResponse{
		UploadURL: presignedURL.String(),
		FileURL:   s.GetPublicURL(objectKey),
		ObjectKey: objectKey,
		ExpiresIn: int(expiresIn.Seconds()),
	}, nil
}

// GetPublicURL 获取对象的公开访问 URL
func (s *storageService) GetPublicURL(objectName string) string {
	protocol := "http"
	if s.useSSL {
		protocol = "https"
	}
	return fmt.Sprintf("%s://%s/%s/%s", protocol, s.endpoint, s.bucket, objectName)
}

// 验证图片扩展名
func isValidImageExtension(ext string) bool {
	validExtensions := map[string]bool{
		".jpg":  true,
		".jpeg": true,
		".png":  true,
		".gif":  true,
		".webp": true,
		".bmp":  true,
	}
	return validExtensions[ext]
}