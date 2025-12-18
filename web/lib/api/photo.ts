import { request } from "./base";

/**
 * Photo 相关 API
 */

export interface Photo {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  thumbnailUrl: string;
  category: string;
  location: string;
  isFeatured: boolean;
  displayOrder: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface ListPhotosResponse {
  data: Photo[];
  total: number;
}

interface CreatePhotoRequest {
  title: string;
  description?: string;
  imageUrl: string;
  thumbnailUrl?: string;
  category?: string;
  location?: string;
  isFeatured?: boolean;
}

interface UpdatePhotoRequest {
  title?: string;
  description?: string;
  category?: string;
  location?: string;
  isFeatured?: boolean;
  status?: string;
}

interface ReorderRequest {
  orders: Array<{ id: number; displayOrder: number }>;
}

/**
 * 获取所有照片
 */
export async function listPhotos(): Promise<ListPhotosResponse> {
  return request<ListPhotosResponse>("/photos");
}

/**
 * 获取单个照片
 */
export async function getPhotoById(id: number): Promise<Photo> {
  return request<Photo>(`/photos/${id}`);
}

/**
 * 创建照片
 */
export async function createPhoto(photo: CreatePhotoRequest): Promise<Photo> {
  return request<Photo>("/photos", {
    method: "POST",
    body: JSON.stringify(photo),
  });
}

/**
 * 更新照片
 */
export async function updatePhoto(id: number, photo: UpdatePhotoRequest): Promise<Photo> {
  return request<Photo>(`/photos/${id}`, {
    method: "PUT",
    body: JSON.stringify(photo),
  });
}

/**
 * 删除照片
 */
export async function deletePhoto(id: number): Promise<{ message: string }> {
  return request<{ message: string }>(`/photos/${id}`, {
    method: "DELETE",
  });
}

/**
 * 批量更新排序
 */
export async function reorderPhotos(
  orders: Array<{ id: number; displayOrder: number }>
): Promise<{ message: string }> {
  return request<{ message: string }>("/photos/reorder", {
    method: "POST",
    body: JSON.stringify({ orders }),
  });
}
