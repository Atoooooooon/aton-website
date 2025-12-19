export const config = {
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080",
} as const;

export const API_ENDPOINTS = {
  // Auth
  login: `${config.apiBaseUrl}/api/v1/auth/login`,
  createUser: `${config.apiBaseUrl}/api/v1/auth/create-user`,
  changePassword: `${config.apiBaseUrl}/api/v1/user/change-password`,

  // Photos (Admin - requires auth)
  photos: `${config.apiBaseUrl}/api/v1/photos`,
  photo: (id: number) => `${config.apiBaseUrl}/api/v1/photos/${id}`,
  photoComponents: (id: number) => `${config.apiBaseUrl}/api/v1/photos/${id}/components`,
  photosReorder: `${config.apiBaseUrl}/api/v1/photos/reorder`,

  // Photos (Public - no auth required)
  photosPublished: `${config.apiBaseUrl}/api/v1/photos/published`,

  // Component Photos
  componentPhotos: `${config.apiBaseUrl}/api/v1/component-photos`,
  componentPhoto: (id: number) => `${config.apiBaseUrl}/api/v1/component-photos/${id}`,
  componentPhotosList: (name: string) => `${config.apiBaseUrl}/api/v1/components/${name}/photos`,

  // Storage
  uploadToken: `${config.apiBaseUrl}/api/v1/storage/upload-token`,
} as const;
