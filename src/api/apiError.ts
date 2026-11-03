// src/api/apiError.ts

/**
 * 공통 오류 응답 (API 명세 2.3)
 */
export class ApiError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

// 실제 서버 통신처럼 딜레이 후 응답하는 더미 헬퍼
export const mockResponse = <T>(data: T, delay = 300): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(data), delay));

export const mockError = (
  status: number,
  code: string,
  message: string,
  delay = 300,
): Promise<never> =>
  new Promise((_, reject) =>
    setTimeout(() => reject(new ApiError(status, code, message)), delay),
  );
