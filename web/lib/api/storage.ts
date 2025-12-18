import { request } from "./base";

/**
 * Storage 相关 API
 */

interface GenerateUploadTokenResponse {
  uploadUrl: string;
  downloadUrl: string;
}

/**
 * 生成上传 token
 */
export async function generateUploadToken(
  filename: string,
  contentType: string
): Promise<GenerateUploadTokenResponse> {
  return request<GenerateUploadTokenResponse>("/storage/upload-token", {
    method: "POST",
    body: JSON.stringify({ filename, contentType }),
  });
}
