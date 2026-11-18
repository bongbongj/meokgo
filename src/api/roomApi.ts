// src/api/roomApi.ts

import { toResponse } from "./apiError";
import { api, isApiError } from "./client";
import type {
  DrinkingOption,
  ParticipantRole,
  RoomStatus,
  ScheduleType,
  TimeSlot,
} from "./types";
import { getInviteUrl, saveInviteUrl } from "../utils/roomStorage";

// Enum은 types.ts 기준 (화면에서는 기존처럼 roomApi에서 import 가능)
export type { DrinkingOption, ParticipantRole, RoomStatus, ScheduleType, TimeSlot };

export interface CreateRoomRequest {
  region_id: number;
  schedule_type: ScheduleType;
  time_slot?: TimeSlot;
  drinking_option: DrinkingOption;
  avoid_foods?: string;
}

export interface CreateRoomResponse {
  success: boolean;
  data: {
    room_id: number;
    room_code: string;
    room_status: RoomStatus;
    max_participant_count: number;
    invite_url: string;
    participant: { participant_id: number; role: ParticipantRole };
  };
}

export interface WaitingParticipant {
  participant_id: number;
  nickname: string;
  role: ParticipantRole;
  connected: boolean;
}

export interface WaitingStatus {
  room_id: number;
  room_status: RoomStatus;
  participants: WaitingParticipant[];
  is_host: boolean;
  host_disconnected: boolean;
  host_action_expired: boolean;
  host_takeover_available_at: string | null;
  host_takeover_remaining_seconds: number;
  can_take_over_host: boolean;
  can_start_vote: boolean;
  // 명세에 없는 필드 (BE 추가 요청 필요) — 방 생성 때 기기에 저장한 링크로 채운다
  // (다른 기기에서 만든 방이면 빈 문자열)
  invite_url: string;
}

export interface RoomCondition {
  schedule_type: ScheduleType;
  time_slot: TimeSlot | null;
  drinking_option: DrinkingOption;
  avoid_foods: string | null;
}

export interface RoomDetail {
  room_id: number;
  room_status: RoomStatus;
  region_name: string;
  condition: RoomCondition;
  participants: (WaitingParticipant & { status: string })[];
}

// BE 탐험방 최대 인원과 같게 유지 (API 명세서: MVP 2~4명)
export const MAX_PARTICIPANT_COUNT = 4;
export const MIN_PARTICIPANT_COUNT = 2;

/**
 * 후보 퀘스트 생성 API (방장)
 * POST /api/v1/rooms/{room_id}/quest-candidates
 * - 후보가 3개 이상 있어야 투표를 시작할 수 있다. 이미 있으면 기존 후보를 그대로 돌려준다.
 * - 오류: QUEST-003(조건에 맞는 퀘스트 부족)
 */
export const createQuestCandidates = async (roomId: number): Promise<void> => {
  await api.post(`/rooms/${roomId}/quest-candidates`);
};

/**
 * 탐험방 생성 API
 * POST /api/v1/rooms
 * - 생성 직후 후보 퀘스트까지 만든다. 조건에 맞는 퀘스트가 부족하면 QUEST-003을 던진다.
 */
export const createRoom = async (
  req: CreateRoomRequest & { region_name: string },
): Promise<CreateRoomResponse> => {
  const { region_name: _regionName, ...body } = req;
  const data = await api.post<CreateRoomResponse["data"]>("/rooms", body);
  await saveInviteUrl(data.room_id, data.invite_url);
  try {
    await createQuestCandidates(data.room_id);
  } catch (error) {
    // 그 외 실패는 07 참여 대기에서 다시 시도한다
    if (isApiError(error) && error.code === "QUEST-003") throw error;
  }
  return { success: true, data };
};

/**
 * 참여 대기 상태 조회 API
 * GET /api/v1/rooms/{room_id}/waiting-status
 */
export const fetchWaitingStatus = async (
  roomId: number,
): Promise<{ success: boolean; data: WaitingStatus }> => {
  const data = await api.get<WaitingStatus>(`/rooms/${roomId}/waiting-status`);
  const inviteUrl = data.invite_url ?? (await getInviteUrl(roomId)) ?? "";
  return { success: true, data: { ...data, invite_url: inviteUrl } };
};

/**
 * 탐험방 상세 조회 API
 * GET /api/v1/rooms/{room_id}
 */
export const fetchRoomDetail = async (
  roomId: number,
): Promise<{ success: boolean; data: RoomDetail }> =>
  toResponse(api.get<RoomDetail>(`/rooms/${roomId}`));

/**
 * 퀘스트 투표 시작 API
 * POST /api/v1/rooms/{room_id}/vote/start
 */
export const startVote = async (
  roomId: number,
): Promise<{
  success: boolean;
  data: { room_id: number; room_status: RoomStatus; vote_id: number };
}> =>
  toResponse(
    api.post<{ room_id: number; room_status: RoomStatus; vote_id: number }>(
      `/rooms/${roomId}/vote/start`,
    ),
  );

/**
 * 방장 권한 이어받기 API
 * POST /api/v1/rooms/{room_id}/host/takeover
 */
export const takeOverHost = async (
  roomId: number,
): Promise<{
  success: boolean;
  data: { room_id: number; host_participant_id: number };
}> =>
  toResponse(
    api.post<{ room_id: number; host_participant_id: number }>(
      `/rooms/${roomId}/host/takeover`,
    ),
  );
