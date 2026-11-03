// src/api/explorationApi.ts
// FE2 — 탐험 시작 / 진행 / 종료 (API명세서 11장)

import { api, ApiError } from "./client";
import { fetchFinalQuests } from "./finalQuestApi";
import { mockResolve, USE_MOCK } from "./mock";
import { getMockRoomStatus, isMockHost, setMockRoomStatus } from "./mockRooms";
import type { RoomStatus } from "./types";

export interface ExplorationStartResult {
  room_id: number;
  room_status: RoomStatus;
}

export interface ExplorationQuest {
  final_quest_id: number;
  quest_title: string;
  completed: boolean;
  completed_participant_count: number;
}

export interface ExplorationProgress {
  room_id: number;
  region_name: string;
  participant_count: number;
  total_quest_count: number;
  completed_quest_count: number;
  progress_rate: number;
  quests: ExplorationQuest[];
  // API명세서에 없음 — 18 탐험 종료에서 참가자가 기록으로 이동할 때 필요 (BE 협의, README 컨펌 필요 사항)
  record_id?: number | null;
}

export interface QuestProgressResult {
  final_quest_id: number;
  completed: boolean;
  completed_at: string | null;
  requires_photo_auth: boolean;
  requires_gps_auth: boolean;
  requires_receipt_auth: boolean;
}

export interface ExplorationFinishResult {
  room_id: number;
  room_status: RoomStatus;
  record_id: number;
  story_optional: boolean;
}

// BE 미구현 API — 구현되면 false로 바꾸고 USE_MOCK.exploration을 따르게 한다
const EXPLORATION_API_PENDING = true;

const isMocked = () => EXPLORATION_API_PENDING || USE_MOCK.exploration;

// ---------------------------------------------------------------------------
// 더미 데이터 — 방별 완료 상태를 화면 사이에서 공유 (새로고침하면 초기화)
// - 참가자 방(짝수)은 퀘스트 3개를 모두 완료하고 약 8초 뒤 방장이 종료한 것으로 처리
// ---------------------------------------------------------------------------
const MOCK_REGION = "행궁동";
const MOCK_PARTICIPANT_COUNT = 3;
const MOCK_AUTO_FINISH_MS = 8000;

const completedByRoom = new Map<number, Map<number, string>>(); // final_quest_id → completed_at
const allDoneAtByRoom = new Map<number, number>();

/** 더미 기록 번호 — 방 번호에서 만든다 (recordApi 더미와 같은 규칙) */
export const mockRecordIdOf = (roomId: number) => 1000 + roomId;

const completedOf = (roomId: number) => {
  let completed = completedByRoom.get(roomId);
  if (!completed) {
    completed = new Map();
    completedByRoom.set(roomId, completed);
  }
  return completed;
};

const mockProgress = async (roomId: number): Promise<ExplorationProgress> => {
  const finalQuests = await fetchFinalQuests(roomId);
  const completed = completedOf(roomId);
  const total = finalQuests.length;
  const done = finalQuests.filter((q) => completed.has(q.final_quest_id)).length;

  // 참가자 방: 모두 완료 후 일정 시간이 지나면 방장이 종료한 것으로 처리
  if (done === total && total > 0) {
    if (!allDoneAtByRoom.has(roomId)) allDoneAtByRoom.set(roomId, Date.now());
    const elapsed = Date.now() - (allDoneAtByRoom.get(roomId) ?? 0);
    if (!isMockHost(roomId) && elapsed >= MOCK_AUTO_FINISH_MS) {
      setMockRoomStatus(roomId, "FINISHED");
    }
  } else {
    allDoneAtByRoom.delete(roomId);
  }

  const finished = getMockRoomStatus(roomId) === "FINISHED";
  return {
    room_id: roomId,
    region_name: MOCK_REGION,
    participant_count: MOCK_PARTICIPANT_COUNT,
    total_quest_count: total,
    completed_quest_count: done,
    progress_rate: total ? Math.round((done / total) * 100) : 0,
    quests: finalQuests.map((q) => {
      const isDone = completed.has(q.final_quest_id);
      return {
        final_quest_id: q.final_quest_id,
        quest_title: q.quest_title,
        completed: isDone,
        completed_participant_count: isDone ? MOCK_PARTICIPANT_COUNT : 0,
      };
    }),
    record_id: finished ? mockRecordIdOf(roomId) : null,
  };
};

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

/** 탐험 시작 (방장) — 방 상태를 IN_PROGRESS로 변경 */
export const startExploration = async (
  roomId: number,
): Promise<ExplorationStartResult> => {
  if (isMocked()) {
    setMockRoomStatus(roomId, "IN_PROGRESS");
    return mockResolve({ room_id: roomId, room_status: "IN_PROGRESS" });
  }
  return api.post<ExplorationStartResult>(`/rooms/${roomId}/exploration/start`);
};

/** 탐험 진행 조회 — 지역, 참여 인원, 퀘스트별 완료 여부, 진행률 */
export const fetchExplorationProgress = async (
  roomId: number,
): Promise<ExplorationProgress> => {
  if (isMocked()) return mockResolve(await mockProgress(roomId), 200);
  return api.get<ExplorationProgress>(`/rooms/${roomId}/exploration/progress`);
};

/** 퀘스트 완료 / 완료 취소 — 사진·GPS·영수증 인증 없음 */
export const updateQuestProgress = async (
  roomId: number,
  finalQuestId: number,
  completed: boolean,
): Promise<QuestProgressResult> => {
  if (isMocked()) {
    // 종료된 탐험 전용 오류 코드가 API명세서에 없어 ROOM-002(이미 진행된 방)로 대신한다
    if (getMockRoomStatus(roomId) === "FINISHED") {
      throw new ApiError("ROOM-002", "이미 종료된 탐험이에요.", 409);
    }
    const map = completedOf(roomId);
    const completedAt = completed ? new Date().toISOString() : null;
    if (completedAt) map.set(finalQuestId, completedAt);
    else map.delete(finalQuestId);
    return mockResolve({
      final_quest_id: finalQuestId,
      completed,
      completed_at: completedAt,
      requires_photo_auth: false,
      requires_gps_auth: false,
      requires_receipt_auth: false,
    });
  }
  return api.patch<QuestProgressResult>(
    `/rooms/${roomId}/final-quests/${finalQuestId}/progress`,
    { completed },
  );
};

/** 탐험 종료 (방장) — 이후 퀘스트 상태 변경 차단, 사용자별 탐험 기록 생성 */
export const finishExploration = async (
  roomId: number,
): Promise<ExplorationFinishResult> => {
  if (isMocked()) {
    setMockRoomStatus(roomId, "FINISHED");
    return mockResolve({
      room_id: roomId,
      room_status: "FINISHED",
      record_id: mockRecordIdOf(roomId),
      story_optional: true,
    });
  }
  return api.post<ExplorationFinishResult>(`/rooms/${roomId}/exploration/finish`);
};
