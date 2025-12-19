/**
 * 照片状态枚举
 * 对应后端 PhotoStatus
 */
export type PhotoStatus = "draft" | "published";

/**
 * 照片实体
 * 对应后端 domain.Photo
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
  status: PhotoStatus;
  createdAt: string; // ISO 8601 时间字符串
  updatedAt: string;
}

/**
 * 创建照片请求
 * 对应后端 CreatePhotoRequest
 */
export interface CreatePhotoRequest {
  title: string;
  description?: string;
  imageUrl: string;
  thumbnailUrl?: string;
  category?: string;
  location?: string;
  isFeatured?: boolean;
  displayOrder?: number;
}

/**
 * 更新照片请求
 * 对应后端 UpdatePhotoRequest
 * 所有字段都是可选的,只更新提供的字段
 */
export interface UpdatePhotoRequest {
  title?: string;
  description?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  category?: string;
  location?: string;
  isFeatured?: boolean;
  displayOrder?: number;
  status?: PhotoStatus;
}

/**
 * 组件照片关联
 * 对应后端 ComponentPhoto
 */
export interface ComponentPhoto {
  id: number;
  componentName: string;
  photoId: number;
  order: number;
  props: ComponentPhotoProps;
  photo: Photo;
  createdAt: string;
  updatedAt: string;
}

/**
 * 组件照片的自定义属性
 */
export interface ComponentPhotoProps {
  caption?: string;
  alt?: string;
  link?: string;
  [key: string]: any; // 允许扩展其他属性
}

/**
 * 创建组件照片关联请求
 */
export interface CreateComponentPhotoRequest {
  componentName: string;
  photoId: number;
  order: number;
  props?: ComponentPhotoProps;
}

/**
 * API 响应包装器
 */
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

/**
 * 分页响应
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}
