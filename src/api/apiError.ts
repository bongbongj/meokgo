// src/api/apiError.ts

import { ApiError } from "./client";

/**
 * 공통 오류 응답 (API 명세 2.3)
 * client.ts의 ApiError를 그대로 사용
 */
export { ApiError };

// 서버 응답(data)을 FE1 화면이 쓰는 { success, data } 형태로 맞춤
export const toResponse = async <T>(
  request: Promise<T>,
): Promise<{ success: true; data: T }> => ({ success: true, data: await request });
