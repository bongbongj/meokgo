// src/api/userApi.ts
// 사용자 API (API명세서 3장)
// - FE2: 닉네임 변경 (12 닉네임 변경 시트)
// - TODO(FE1): nicknameApi.ts의 bootstrap / 닉네임 최초 설정을 이 파일로 옮긴다 — FE 협업 규칙 3.2

import { api } from "./client";
import { mockResolve, USE_MOCK } from "./mock";

export interface NicknameUpdateResult {
  user_id: number;
  nickname: string;
}

/** 닉네임 변경 — 1~10자, 앞뒤 공백 제거 후 전송 */
export const updateNickname = async (
  nickname: string,
): Promise<NicknameUpdateResult> => {
  const trimmed = nickname.trim();
  if (USE_MOCK.user) {
    return mockResolve({ user_id: 1, nickname: trimmed });
  }
  return api.patch<NicknameUpdateResult>("/users/me/nickname", { nickname: trimmed });
};
