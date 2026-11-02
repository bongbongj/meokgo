// src/api/mock.ts
// 더미 / 실서버 전환
// - 전체 기본값: EXPO_PUBLIC_USE_MOCK ("false"면 실서버, 그 외에는 더미)
// - BE 구현이 끝난 API는 아래 표에서 도메인별로 false로 바꿔 실서버에 연결한다.

const MOCK_DEFAULT = process.env.EXPO_PUBLIC_USE_MOCK !== "false";

// API명세서.md 장(章) 단위
export type ApiDomain =
  | "user"
  | "home"
  | "region"
  | "room"
  | "invite"
  | "questCandidate"
  | "vote"
  | "finalQuest"
  | "exploration"
  | "record"
  | "story";

export const USE_MOCK: Record<ApiDomain, boolean> = {
  user: MOCK_DEFAULT,
  home: MOCK_DEFAULT,
  region: MOCK_DEFAULT,
  room: MOCK_DEFAULT,
  invite: MOCK_DEFAULT,
  questCandidate: MOCK_DEFAULT,
  vote: MOCK_DEFAULT,
  finalQuest: MOCK_DEFAULT,
  exploration: MOCK_DEFAULT,
  record: MOCK_DEFAULT,
  story: MOCK_DEFAULT,
};

/**
 * 더미 응답 반환
 * 실제 서버처럼 약간의 지연 후 data만 돌려준다. (client.ts의 api.* 반환값과 같은 형태)
 */
export const mockResolve = <T>(data: T, delayMs = 300): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(data), delayMs));
