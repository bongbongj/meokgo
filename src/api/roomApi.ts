// src/api/roomApi.ts

import { mockError, mockResponse, toResponse } from "./apiError";
import { api } from "./client";
import { USE_MOCK } from "./mock";
import { setMockHost, setMockRoomStatus } from "./mockRooms";
import type {
  DrinkingOption,
  ParticipantRole,
  RoomStatus,
  ScheduleType,
  TimeSlot,
} from "./types";
import { getStoredNickname } from "../utils/userStorage";

// Enum은 types.ts 기준 (화면에서는 기존처럼 roomApi에서 import 가능)
export type { DrinkingOption, ParticipantRole, RoomStatus, ScheduleType, TimeSlot };

// BE 미구현 API (구현되면 false로 바꿔 USE_MOCK.room 설정을 따르게 한다)
const ROOM_DETAIL_API_PENDING = true; // GET /rooms/{room_id}
const HOST_TAKEOVER_API_PENDING = true; // POST /rooms/{room_id}/host/takeover

export interface CreateRoomRequest {
  region_id: number;
  schedule_type: ScheduleType;
  time_slot?: TimeSlot;
  budget_min?: number;
  budget_max?: number;
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
  // 명세에 없는 필드: 대기 화면에 초대 링크를 보여주려면 BE에 추가 요청 필요
  // (실서버 응답에 없으면 빈 문자열)
  invite_url: string;
}

export interface RoomCondition {
  schedule_type: ScheduleType;
  time_slot: TimeSlot | null;
  budget_min: number | null;
  budget_max: number | null;
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

export const MAX_PARTICIPANT_COUNT = 6;
export const MIN_PARTICIPANT_COUNT = 2;

// ---- 더미 저장소 (서버 연결 시 제거) ----

interface MockRoom {
  room_id: number;
  room_status: RoomStatus;
  region_name: string;
  invite_token: string;
  host_nickname: string;
  created_at: string;
  participants: WaitingParticipant[];
  my_participant_id: number | null;
  pending_friends: string[]; // 폴링마다 한 명씩 참여하는 것처럼 보이게 함
  condition?: RoomCondition;
  host_disconnect_after_polls?: number; // 이 횟수만큼 폴링 후 방장 미접속 (07-1 확인용)
}

const DEFAULT_CONDITION: RoomCondition = {
  schedule_type: "MEAL",
  time_slot: null,
  budget_min: null,
  budget_max: null,
  drinking_option: "ANY",
  avoid_foods: "매운 음식",
};

const INVITE_BASE_URL = "https://meokgo.app/join/";

const participant = (
  participant_id: number,
  nickname: string,
  role: ParticipantRole,
  connected = true,
): WaitingParticipant => ({ participant_id, nickname, role, connected });

export const mockRooms = new Map<number, MockRoom>([
  // 초대 링크 테스트용: A2F8 참여 가능
  // 참여 후 08 참가자 대기 → 약 15초 뒤 방장 미접속 → 07-1
  [
    90,
    {
      room_id: 90,
      room_status: "WAITING",
      region_name: "행궁동",
      invite_token: "A2F8",
      host_nickname: "민교",
      created_at: "2026-09-30T10:00:00",
      participants: [
        participant(1, "민교", "HOST"),
        participant(2, "서연", "MEMBER"),
      ],
      my_participant_id: null,
      pending_friends: [],
      host_disconnect_after_polls: 4,
    },
  ],
  // 참여 마감 테스트용 토큰: STARTED / FINISHED / FULL
  [
    91,
    {
      room_id: 91,
      room_status: "VOTING",
      region_name: "성수동",
      invite_token: "STARTED",
      host_nickname: "민교",
      created_at: "2026-09-30T10:00:00",
      participants: [participant(1, "민교", "HOST"), participant(2, "서연", "MEMBER")],
      my_participant_id: null,
      pending_friends: [],
    },
  ],
  [
    92,
    {
      room_id: 92,
      room_status: "FINISHED",
      region_name: "을지로",
      invite_token: "FINISHED",
      host_nickname: "민교",
      created_at: "2026-09-30T10:00:00",
      participants: [participant(1, "민교", "HOST")],
      my_participant_id: null,
      pending_friends: [],
    },
  ],
  [
    93,
    {
      room_id: 93,
      room_status: "WAITING",
      region_name: "망원동",
      invite_token: "FULL",
      host_nickname: "민교",
      created_at: "2026-09-30T10:00:00",
      participants: ["민교", "서연", "현진", "지우", "하늘", "도윤"].map((name, idx) =>
        participant(idx + 1, name, idx === 0 ? "HOST" : "MEMBER"),
      ),
      my_participant_id: null,
      pending_friends: [],
    },
  ],
]);

let nextRoomId = 100;

const randomToken = () =>
  Math.random().toString(36).slice(2, 6).toUpperCase();

const toWaitingStatus = (room: MockRoom): WaitingStatus => {
  const me = room.participants.find(
    (p) => p.participant_id === room.my_participant_id,
  );
  const host = room.participants.find((p) => p.role === "HOST");
  const isHost = me?.role === "HOST";
  const hostDisconnected = !!host && !host.connected;

  return {
    room_id: room.room_id,
    room_status: room.room_status,
    participants: room.participants,
    is_host: isHost,
    host_disconnected: hostDisconnected,
    host_action_expired: hostDisconnected,
    host_takeover_available_at: null,
    host_takeover_remaining_seconds: hostDisconnected ? 0 : 300,
    can_take_over_host: !isHost && hostDisconnected,
    can_start_vote:
      isHost &&
      room.room_status === "WAITING" &&
      room.participants.length >= MIN_PARTICIPANT_COUNT,
    invite_url: INVITE_BASE_URL + room.invite_token,
  };
};

const getRoomOrError = (roomId: number) => {
  const room = mockRooms.get(roomId);
  return room ?? null;
};

/**
 * 탐험방 생성 API (더미)
 * POST /api/v1/rooms
 */
export const createRoom = async (
  req: CreateRoomRequest & { region_name: string },
): Promise<CreateRoomResponse> => {
  if (!USE_MOCK.room) {
    const { region_name: _regionName, ...body } = req;
    return toResponse(api.post<CreateRoomResponse["data"]>("/rooms", body));
  }

  const roomId = nextRoomId++;
  // 방장 닉네임 = 01 닉네임 설정에서 입력해 기기에 저장한 값 (서버 연결 시 서버가 결정)
  const hostNickname = (await getStoredNickname()) ?? "방장";
  const token = randomToken();

  mockRooms.set(roomId, {
    room_id: roomId,
    room_status: "WAITING",
    region_name: req.region_name,
    invite_token: token,
    host_nickname: hostNickname,
    created_at: new Date().toISOString(),
    participants: [participant(1, hostNickname, "HOST")],
    my_participant_id: 1,
    pending_friends: ["서연", "현진"],
    condition: {
      schedule_type: req.schedule_type,
      time_slot: req.time_slot ?? null,
      budget_min: req.budget_min ?? null,
      budget_max: req.budget_max ?? null,
      drinking_option: req.drinking_option,
      avoid_foods: req.avoid_foods ?? null,
    },
  });
  setMockHost(roomId, true);

  return mockResponse({
    success: true,
    data: {
      room_id: roomId,
      room_code: `MGO${roomId}`,
      room_status: "WAITING",
      max_participant_count: MAX_PARTICIPANT_COUNT,
      invite_url: INVITE_BASE_URL + token,
      participant: { participant_id: 1, role: "HOST" },
    },
  });
};

/**
 * 참여 대기 상태 조회 API (더미)
 * GET /api/v1/rooms/{room_id}/waiting-status
 */
export const fetchWaitingStatus = async (
  roomId: number,
): Promise<{ success: boolean; data: WaitingStatus }> => {
  if (!USE_MOCK.room) {
    const data = await api.get<WaitingStatus>(`/rooms/${roomId}/waiting-status`);
    return { success: true, data: { ...data, invite_url: data.invite_url ?? "" } };
  }

  const room = getRoomOrError(roomId);
  if (!room) return mockError(404, "ROOM-001", "탐험방을 찾을 수 없습니다.");

  // 친구가 한 명씩 들어오는 상황 흉내
  const nextFriend = room.pending_friends.shift();
  if (nextFriend && room.room_status === "WAITING") {
    room.participants.push(
      participant(room.participants.length + 1, nextFriend, "MEMBER"),
    );
  }

  // 일정 시간 뒤 방장이 접속을 끊은 상황 흉내 (내가 참가자일 때만)
  if (room.host_disconnect_after_polls !== undefined && room.my_participant_id) {
    room.host_disconnect_after_polls -= 1;
    if (room.host_disconnect_after_polls <= 0) {
      room.participants = room.participants.map((p) =>
        p.role === "HOST" && p.participant_id !== room.my_participant_id
          ? { ...p, connected: false }
          : p,
      );
      room.host_disconnect_after_polls = undefined;
    }
  }

  return mockResponse({ success: true, data: toWaitingStatus(room) }, 200);
};

/**
 * 탐험방 상세 조회 API (더미)
 * GET /api/v1/rooms/{room_id}
 */
export const fetchRoomDetail = async (
  roomId: number,
): Promise<{ success: boolean; data: RoomDetail }> => {
  if (!ROOM_DETAIL_API_PENDING && !USE_MOCK.room) {
    return toResponse(api.get<RoomDetail>(`/rooms/${roomId}`));
  }

  const room = getRoomOrError(roomId);
  if (!room) return mockError(404, "ROOM-001", "탐험방을 찾을 수 없습니다.");

  return mockResponse({
    success: true,
    data: {
      room_id: room.room_id,
      room_status: room.room_status,
      region_name: room.region_name,
      condition: room.condition ?? DEFAULT_CONDITION,
      participants: room.participants.map((p) => ({ ...p, status: "WAITING" })),
    },
  });
};

/**
 * 퀘스트 투표 시작 API (더미)
 * POST /api/v1/rooms/{room_id}/vote/start
 */
export const startVote = async (
  roomId: number,
): Promise<{
  success: boolean;
  data: { room_id: number; room_status: RoomStatus; vote_id: number };
}> => {
  if (!USE_MOCK.room) {
    return toResponse(
      api.post<{ room_id: number; room_status: RoomStatus; vote_id: number }>(
        `/rooms/${roomId}/vote/start`,
      ),
    );
  }

  const room = getRoomOrError(roomId);
  if (!room) return mockError(404, "ROOM-001", "탐험방을 찾을 수 없습니다.");
  if (!toWaitingStatus(room).is_host)
    return mockError(403, "ROOM-004", "방장 권한이 없습니다.");

  room.room_status = "VOTING";
  setMockRoomStatus(roomId, "VOTING"); // 09 퀘스트 투표 더미와 상태 공유
  return mockResponse({
    success: true,
    data: { room_id: roomId, room_status: "VOTING", vote_id: 5 },
  });
};

/**
 * 방장 권한 이어받기 API (더미)
 * POST /api/v1/rooms/{room_id}/host/takeover
 */
export const takeOverHost = async (
  roomId: number,
): Promise<{
  success: boolean;
  data: { room_id: number; host_participant_id: number };
}> => {
  if (!HOST_TAKEOVER_API_PENDING && !USE_MOCK.room) {
    return toResponse(
      api.post<{ room_id: number; host_participant_id: number }>(
        `/rooms/${roomId}/host/takeover`,
      ),
    );
  }

  const room = getRoomOrError(roomId);
  if (!room) return mockError(404, "ROOM-001", "탐험방을 찾을 수 없습니다.");
  if (!toWaitingStatus(room).can_take_over_host)
    return mockError(409, "ROOM-005", "방장 권한 이어받기 가능 시간이 아닙니다.");

  room.participants = room.participants.map((p) => ({
    ...p,
    role: p.participant_id === room.my_participant_id ? "HOST" : "MEMBER",
  }));
  setMockHost(roomId, true);

  return mockResponse({
    success: true,
    data: { room_id: roomId, host_participant_id: room.my_participant_id! },
  });
};
