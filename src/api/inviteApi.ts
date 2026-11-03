// src/api/inviteApi.ts

import { mockError, mockResponse } from "./apiError";
import { MAX_PARTICIPANT_COUNT, mockRooms, RoomStatus } from "./roomApi";

export type UnjoinableReason =
  | "EXPIRED"
  | "ALREADY_STARTED"
  | "FULL"
  | "INVALID_LINK"
  | "FINISHED";

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

const findRoomByToken = (token: string) =>
  [...mockRooms.values()].find((room) => room.invite_token === token);

const getUnjoinableReason = (
  status: RoomStatus,
  participantCount: number,
): UnjoinableReason | null => {
  if (status === "EXPIRED") return "EXPIRED";
  if (status === "FINISHED") return "FINISHED";
  if (status !== "WAITING") return "ALREADY_STARTED";
  if (participantCount >= MAX_PARTICIPANT_COUNT) return "FULL";
  return null;
};

/**
 * 초대 정보 조회 API (더미)
 * GET /api/v1/invites/{invite_token}
 */
export const fetchInvite = async (
  token: string,
): Promise<{ success: boolean; data: InviteInfo }> => {
  const room = findRoomByToken(token);

  if (!room) {
    return mockResponse({
      success: true,
      data: {
        invite_token: token,
        room_id: 0,
        host_nickname: "",
        region_name: "",
        created_at: "",
        expired_at: "",
        joinable: false,
        unjoinable_reason: "INVALID_LINK",
      },
    });
  }

  const reason = getUnjoinableReason(room.room_status, room.participants.length);
  const createdAt = new Date(room.created_at);
  const expiredAt = new Date(createdAt.getTime() + 24 * 60 * 60 * 1000);

  return mockResponse({
    success: true,
    data: {
      invite_token: token,
      room_id: room.room_id,
      host_nickname: room.host_nickname,
      region_name: room.region_name,
      created_at: room.created_at,
      expired_at: expiredAt.toISOString(),
      joinable: reason === null,
      unjoinable_reason: reason,
    },
  });
};

/**
 * 초대 링크 참여 API (더미)
 * POST /api/v1/invites/{invite_token}/join
 * 오류: PARTICIPANT-003(닉네임 중복), ROOM-002(투표 시작), PARTICIPANT-002(정원 초과), INVITE-002(만료)
 */
export const joinInvite = async (
  token: string,
  nickname: string,
): Promise<JoinResponse> => {
  const room = findRoomByToken(token);
  if (!room) return mockError(400, "INVITE-001", "잘못된 초대 링크입니다.");

  const reason = getUnjoinableReason(room.room_status, room.participants.length);
  if (reason === "EXPIRED")
    return mockError(410, "INVITE-002", "만료된 초대 링크입니다.");
  if (reason === "FULL")
    return mockError(409, "PARTICIPANT-002", "정원이 초과되었습니다.");
  if (reason)
    return mockError(409, "ROOM-002", "이미 투표 또는 탐험이 시작된 방입니다.");

  if (room.participants.some((p) => p.nickname === nickname)) {
    return mockError(409, "PARTICIPANT-003", "이미 사용 중인 닉네임입니다.");
  }

  const participantId = room.participants.length + 1;
  room.participants.push({
    participant_id: participantId,
    nickname,
    role: "MEMBER",
    connected: true,
  });
  room.my_participant_id = participantId;

  return mockResponse({
    success: true,
    data: {
      room_id: room.room_id,
      participant_id: participantId,
      room_status: room.room_status,
      restored_by_device: false,
    },
  });
};
