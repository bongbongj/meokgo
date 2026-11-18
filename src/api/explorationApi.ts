// src/api/explorationApi.ts
// FE2 — 탐험 시작 / 진행 / 종료 (API명세서 11장)

import { api } from "./client";
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
  // API명세서에 없음 — 18 탐험 종료에서 내 기록 목록으로 찾아 채운다 (BE 진행 조회에 record_id 없음)
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

/** 탐험 시작 (방장) — 방 상태를 IN_PROGRESS로 변경 */
export const startExploration = async (
  roomId: number,
): Promise<ExplorationStartResult> =>
  api.post<ExplorationStartResult>(`/rooms/${roomId}/exploration/start`);

/** 탐험 진행 조회 — 지역, 참여 인원, 퀘스트별 완료 여부, 진행률 */
export const fetchExplorationProgress = async (
  roomId: number,
): Promise<ExplorationProgress> =>
  api.get<ExplorationProgress>(`/rooms/${roomId}/exploration/progress`);

/** 퀘스트 완료 / 완료 취소 — 사진·GPS·영수증 인증 없음 */
export const updateQuestProgress = async (
  roomId: number,
  finalQuestId: number,
  completed: boolean,
): Promise<QuestProgressResult> =>
  api.patch<QuestProgressResult>(
    `/rooms/${roomId}/final-quests/${finalQuestId}/progress`,
    { completed },
  );

/** 탐험 종료 (방장) — 이후 퀘스트 상태 변경 차단, 사용자별 탐험 기록 생성 */
export const finishExploration = async (
  roomId: number,
): Promise<ExplorationFinishResult> =>
  api.post<ExplorationFinishResult>(`/rooms/${roomId}/exploration/finish`);
