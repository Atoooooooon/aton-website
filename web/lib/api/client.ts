import { API_ENDPOINTS } from "../config";

/**
 * API 错误类
 * 携带 HTTP 状态码和详细错误信息
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public url: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * 统一的 API 客户端
 *
 * 前台接口不需要 token
 * 后台管理接口需要 token
 */
class ApiClient {
  /**
   * 统一响应处理
   * 检查状态码、Content-Type,提取错误信息
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get("content-type");
    const isJson = contentType?.includes("application/json");

    // HTTP 错误处理
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

      // 尝试从响应体提取详细错误信息
      if (isJson) {
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
          // JSON 解析失败,使用默认错误信息
        }
      } else {
        try {
          const textError = await response.text();
          if (textError) {
            errorMessage = textError;
          }
        } catch {
          // 读取文本失败,使用默认错误信息
        }
      }

      throw new ApiError(errorMessage, response.status, response.url);
    }

    // 成功响应的 JSON 解析
    if (isJson) {
      return response.json();
    }

    // 非 JSON 响应视为错误
    throw new ApiError(
      `Expected JSON response but got ${contentType}`,
      response.status,
      response.url
    );
  }

  /**
   * 获取请求头
   * @param requireAuth 是否需要认证(默认: true)
   */
  private getHeaders(requireAuth = true): HeadersInit {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    // 只在需要认证时添加 token
    if (requireAuth && typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    }

    return headers;
  }

  /**
   * GET 请求
   * @param url 请求地址
   * @param requireAuth 是否需要认证(默认: true)
   */
  async get<T>(url: string, requireAuth = true): Promise<T> {
    try {
      const response = await fetch(url, {
        method: "GET",
        headers: this.getHeaders(requireAuth),
      });
      return this.handleResponse<T>(response);
    } catch (error) {
      // 网络错误或其他非 HTTP 错误
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        `Network error: ${error instanceof Error ? error.message : "Unknown error"}`,
        0,
        url
      );
    }
  }

  /**
   * POST 请求
   * @param url 请求地址
   * @param data 请求体
   * @param requireAuth 是否需要认证(默认: true)
   */
  async post<T>(url: string, data?: unknown, requireAuth = true): Promise<T> {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: this.getHeaders(requireAuth),
        ...(data ? { body: JSON.stringify(data) } : {}),
      });
      return this.handleResponse<T>(response);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        `Network error: ${error instanceof Error ? error.message : "Unknown error"}`,
        0,
        url
      );
    }
  }

  /**
   * PUT 请求
   * @param url 请求地址
   * @param data 请求体
   * @param requireAuth 是否需要认证(默认: true)
   */
  async put<T>(url: string, data: unknown, requireAuth = true): Promise<T> {
    try {
      const response = await fetch(url, {
        method: "PUT",
        headers: this.getHeaders(requireAuth),
        body: JSON.stringify(data),
      });
      return this.handleResponse<T>(response);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        `Network error: ${error instanceof Error ? error.message : "Unknown error"}`,
        0,
        url
      );
    }
  }

  /**
   * DELETE 请求
   * @param url 请求地址
   * @param requireAuth 是否需要认证(默认: true)
   */
  async delete<T>(url: string, requireAuth = true): Promise<T> {
    try {
      const response = await fetch(url, {
        method: "DELETE",
        headers: this.getHeaders(requireAuth),
      });
      return this.handleResponse<T>(response);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        `Network error: ${error instanceof Error ? error.message : "Unknown error"}`,
        0,
        url
      );
    }
  }

  /**
   * 检查是否已登录
   */
  isAuthenticated(): boolean {
    if (typeof window === "undefined") return false;
    return !!localStorage.getItem("token");
  }

  /**
   * 退出登录
   */
  logout(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
    }
  }
}

export const apiClient = new ApiClient();
export { API_ENDPOINTS };
