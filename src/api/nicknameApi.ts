// src/api/nicknameApi.ts
// TODO: userApi.ts(bootstrap, 닉네임 변경)와 합치기 — FE 협업 규칙 3.2

import { toResponse } from "./apiError";
import { api } from "./client";

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
): Promise<NicknameResponse> =>
  toResponse(api.post<NicknameResponse["data"]>("/users/me/nickname", data));
