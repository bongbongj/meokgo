// src/api/apiError.ts

import { ApiError } from "./client";
import type { ApiErrorCode } from "./types";

/**
 * 공통 오류 응답 (API 명세 2.3)
 * 실서버 오류와 더미 오류가 같은 클래스가 되도록 client.ts의 ApiError를 그대로 사용
 */
export { ApiError };

// 실제 서버 통신처럼 딜레이 후 응답하는 더미 헬퍼
export const mockResponse = <T>(data: T, delay = 300): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(data), delay));

// 실서버 응답(data)을 더미와 같은 { success, data } 형태로 맞춤
export const toResponse = async <T>(
  request: Promise<T>,
): Promise<{ success: true; data: T }> => ({ success: true, data: await request });

export const mockError = (
  status: number,
  code: ApiErrorCode,
  message: string,
  delay = 300,
): Promise<never> =>
  new Promise((_, reject) =>
    setTimeout(() => reject(new ApiError(code, message, status)), delay),
  );
