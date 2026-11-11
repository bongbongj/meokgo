// src/api/userApi.ts
// 사용자 API (API명세서 3장)
// - FE2: 닉네임 변경 (12 닉네임 변경 시트)
// - TODO(FE1): nicknameApi.ts의 bootstrap / 닉네임 최초 설정을 이 파일로 옮긴다 — FE 협업 규칙 3.2

import { api } from "./client";
import { mockResolve, USE_MOCK } from "./mock";
import { getStoredNickname } from "../utils/userStorage";

export interface Bootstrap {
  user_id: number | null;
  nickname: string | null;
  first_launch: boolean;
  has_active_room: boolean;
  active_room_id: number | null;
  active_participant_id: number | null;
  restored_by_device: boolean;
  vote_restored: boolean;
}

/** 앱 시작 정보 — 서버에 등록된 닉네임, 진행 중인 탐험방 */
export const fetchBootstrap = async (): Promise<Bootstrap> => {
  if (USE_MOCK.user) {
    const nickname = await getStoredNickname();
    return mockResolve(
      {
        user_id: nickname ? 1 : null,
        nickname,
        first_launch: !nickname,
        has_active_room: false,
        active_room_id: null,
        active_participant_id: null,
        restored_by_device: false,
        vote_restored: false,
      },
      0,
    );
  }
  return api.get<Bootstrap>("/users/me/bootstrap");
};

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
