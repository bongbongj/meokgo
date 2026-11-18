// src/api/client.ts
// 공통 API 클라이언트
// - Base URL: EXPO_PUBLIC_API_URL + /api/v1
// - 모든 요청에 X-Device-Key 헤더 추가
// - 성공 시 data만 반환, 실패 시 ApiError throw

import { getDeviceKey } from "./deviceKey";
import type { ApiErrorBody, ApiErrorCode, ApiFieldError, ApiResponse } from "./types";

export const SERVER_URL = (
  process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8080"
).replace(/\/$/, "");
export const API_BASE_URL = `${SERVER_URL}/api/v1`;

/**
 * 서버가 내려준 이미지 주소를 이 기기에서 열 수 있는 주소로 바꾼다
 * - 로컬 BE는 지역 대표 이미지를 http://localhost:8080/... 으로 내려준다
 *   (BE는 http 주소를 localhost만 허용해서 PC IP로 바꿀 수 없음)
 * - 폰(Expo Go)에서 localhost는 폰 자신이라 열리지 않으므로, 앞부분을 .env의 BE 주소로 바꾼다
 * - 그 외 주소(https, 기기 사진 등)는 그대로 둔다
 */
export const toReachableUrl = (url: string): string =>
  url.replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?(?=\/|$)/i, SERVER_URL);

const TIMEOUT_MS = 10000;
// 사진 업로드는 느린 연결에서 여러 장을 보내므로 더 오래 기다린다
const UPLOAD_TIMEOUT_MS = 60000;

/**
 * API 오류
 * 화면에서는 code로 분기한다. (예: error.code === "PARTICIPANT-003")
 */
export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly status: number;
  readonly errors: ApiFieldError[];

  constructor(
    code: ApiErrorCode,
    message: string,
    status = 0,
    errors: ApiFieldError[] = [],
  ) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.errors = errors;
  }
}

export const isApiError = (error: unknown): error is ApiError =>
  error instanceof ApiError;

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface RequestOptions {
  body?: unknown; // JSON 본문
  formData?: FormData; // 파일 업로드 (multipart/form-data)
}

const parseJson = async (response: Response): Promise<unknown> => {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

const toApiError = (status: number, body: unknown): ApiError => {
  const errorBody = body as Partial<ApiErrorBody> | null;
  if (errorBody?.code && errorBody.message) {
    return new ApiError(
      errorBody.code as ApiErrorCode,
      errorBody.message,
      status,
      errorBody.errors ?? [],
    );
  }
  return new ApiError("UNKNOWN", "요청을 처리하지 못했습니다.", status);
};

const request = async <T>(
  method: HttpMethod,
  path: string,
  { body, formData }: RequestOptions = {},
): Promise<T> => {
  const headers: Record<string, string> = {
    Accept: "application/json",
    "X-Device-Key": await getDeviceKey(),
  };
  // multipart는 boundary를 fetch가 직접 넣도록 Content-Type을 지정하지 않음
  if (!formData) headers["Content-Type"] = "application/json";

  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(),
    formData ? UPLOAD_TIMEOUT_MS : TIMEOUT_MS,
  );

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: formData ?? (body !== undefined ? JSON.stringify(body) : undefined),
      signal: controller.signal,
    });
  } catch {
    if (controller.signal.aborted) {
      throw new ApiError("TIMEOUT", "서버 응답이 지연되고 있습니다.");
    }
    throw new ApiError("NETWORK", "서버에 연결할 수 없습니다.");
  } finally {
    clearTimeout(timer);
  }

  const json = await parseJson(response);
  if (!response.ok) throw toApiError(response.status, json);

  // 메시지만 내려오는 성공 응답은 data가 없으므로 undefined를 반환
  return (json as ApiResponse<T> | null)?.data as T;
};

export const api = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, { body }),
  put: <T>(path: string, body?: unknown) => request<T>("PUT", path, { body }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>("PATCH", path, { body }),
  delete: <T>(path: string) => request<T>("DELETE", path),
  upload: <T>(path: string, formData: FormData) =>
    request<T>("POST", path, { formData }),
};
