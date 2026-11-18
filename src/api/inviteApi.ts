// src/api/inviteApi.ts

import { toResponse } from "./apiError";
import { api } from "./client";
import type { RoomStatus } from "./roomApi";
import type { InviteUnjoinableReason } from "./types";

export type UnjoinableReason = InviteUnjoinableReason;

export interface InviteInfo {
  invite_token: string;
  room_id: number;
  host_nickname: string;
  region_name: string;
  created_at: string;
  expired_at: string;
  joinable: boolean;
  unjoinable_reason: UnjoinableReason | null;
}

export interface JoinResponse {
  success: boolean;
  data: {
    room_id: number;
    participant_id: number;
    room_status: RoomStatus;
    restored_by_device: boolean;
  };
}

/**
 * 초대 정보 조회 API
 * GET /api/v1/invites/{invite_token}
 */
export const fetchInvite = async (
  token: string,
): Promise<{ success: boolean; data: InviteInfo }> =>
  toResponse(api.get<InviteInfo>(`/invites/${encodeURIComponent(token)}`));

/**
 * 초대 링크 참여 API
 * POST /api/v1/invites/{invite_token}/join
 * 오류: PARTICIPANT-003(닉네임 중복), ROOM-002(투표 시작), PARTICIPANT-002(정원 초과), INVITE-002(만료)
 */
export const joinInvite = async (
  token: string,
  nickname: string,
): Promise<JoinResponse> =>
  toResponse(
    api.post<JoinResponse["data"]>(`/invites/${encodeURIComponent(token)}/join`, {
      nickname,
    }),
  );
