/**
 * API 统一导出
 *
 * 使用方式:
 * import * as authAPI from '@/lib/api/auth';
 * import * as photoAPI from '@/lib/api/photo';
 * import * as storageAPI from '@/lib/api/storage';
 * import { isAuthenticated, logout } from '@/lib/api';
 */

// 导出基础工具
export { isAuthenticated, logout } from "./base";

// 导出各模块 API
export * as authAPI from "./auth";
export * as photoAPI from "./photo";
export * as storageAPI from "./storage";
