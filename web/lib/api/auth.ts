import { apiClient, API_ENDPOINTS } from "./client";

interface LoginResponse {
  token: string;
}

interface UserResponse {
  id: number;
  username: string;
  email: string;
}

export async function login(
  username: string,
  password: string
): Promise<LoginResponse> {
  return apiClient.post<LoginResponse>(API_ENDPOINTS.login, {
    username,
    password,
  });
}

export async function changePassword(
  oldPassword: string,
  newPassword: string
): Promise<UserResponse> {
  return apiClient.post<UserResponse>(API_ENDPOINTS.changePassword, {
    oldPassword,
    newPassword,
  });
}
