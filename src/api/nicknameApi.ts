// src/api/nicknameApi.ts
// TODO: userApi.ts(bootstrap, 닉네임 변경)와 합치기 — FE 협업 규칙 3.2

import { toResponse } from "./apiError";
import { api } from "./client";
import { USE_MOCK } from "./mock";

interface NicknameRequest {
  nickname: string;
}

interface NicknameResponse {
  success: boolean;
  data: {
    user_id: number;
    nickname: string;
    first_launch: boolean;
  };
}

export const setNickname = async (
  data: NicknameRequest,
): Promise<NicknameResponse> => {
  if (!USE_MOCK.user) {
    return toResponse(
      api.post<NicknameResponse["data"]>("/users/me/nickname", data),
    );
  }

  // 실제 서버 통신처럼 0.5초 딜레이를 줌
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        data: {
          user_id: 1, // 더미 유저 ID
          nickname: data.nickname,
          first_launch: false,
        },
      });
    }, 500);
  });
};
