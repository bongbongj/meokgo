// src/api/explorationApi.ts
// FE2 — 탐험 시작 / 진행 / 종료 (API명세서 11장)

import { api } from "./client";
import { mockResolve, USE_MOCK } from "./mock";
import { setMockRoomStatus } from "./mockRooms";
import type { RoomStatus } from "./types";

export interface ExplorationStartResult {
  room_id: number;
  room_status: RoomStatus;
}

// BE 미구현 API — 구현되면 false로 바꾸고 USE_MOCK.exploration을 따르게 한다
const EXPLORATION_API_PENDING = true;

/** 탐험 시작 (방장) — 방 상태를 IN_PROGRESS로 변경 */
export const startExploration = async (
  roomId: number,
): Promise<ExplorationStartResult> => {
  if (EXPLORATION_API_PENDING || USE_MOCK.exploration) {
    setMockRoomStatus(roomId, "IN_PROGRESS");
    return mockResolve({ room_id: roomId, room_status: "IN_PROGRESS" });
  }
  return api.post<ExplorationStartResult>(`/rooms/${roomId}/exploration/start`);
};
