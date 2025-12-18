import { request } from "./base";

/**
 * 认证相关 API
 */

interface LoginResponse {
  token: string;
  user: {
    id: number;
    username: string;
    email: string;
    role: string;
  };
}

interface CreateUserResponse {
  message: string;
  user: {
    id: number;
    username: string;
    email: string;
    role: string;
  };
}

interface ChangePasswordResponse {
  message: string;
  user: {
    id: number;
    username: string;
    email: string;
  };
}

/**
 * 用户登录
 */
export async function login(username: string, password: string): Promise<LoginResponse> {
  return request<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

/**
 * 创建用户
 */
export async function createUser(
  username: string,
  password: string,
  email?: string
): Promise<CreateUserResponse> {
  return request<CreateUserResponse>("/auth/create-user", {
    method: "POST",
    body: JSON.stringify({ username, password, email }),
  });
}

/**
 * 修改密码
 */
export async function changePassword(
  oldPassword: string,
  newPassword: string
): Promise<ChangePasswordResponse> {
  return request<ChangePasswordResponse>("/user/change-password", {
    method: "POST",
    body: JSON.stringify({ oldPassword, newPassword }),
  });
}
