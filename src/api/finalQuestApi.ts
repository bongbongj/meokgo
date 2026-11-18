// src/api/finalQuestApi.ts
// FE2 — 최종 퀘스트 확정 (API명세서 10장)
// 동점 처리: 재투표 없이 방장이 동점 후보 중 직접 선택한다. (README 결정 사항)

import { api } from "./client";
import type { FinalQuestSelectionReason, RoomStatus } from "./types";

export interface FinalQuestCandidate {
  candidate_id: number;
  quest_title: string;
  vote_count: number;
  rank_no?: number;
}

export interface TieGroup {
  tie_group_no: number;
  required_select_count: number; // 이 그룹에서 방장이 골라야 하는 개수
  candidates: FinalQuestCandidate[];
}

export interface FinalQuestPreview {
  tie_break_required: boolean;
  auto_confirmable: boolean;
  final_quest_candidates?: FinalQuestCandidate[]; // 동점 없음
  tie_groups?: TieGroup[]; // 동점 있음
}

export interface FinalQuest {
  final_quest_id: number;
  rank_no: number;
  quest_title: string;
  vote_count: number;
  selection_reason: FinalQuestSelectionReason;
}

export interface FinalQuestConfirmResult {
  room_id: number;
  room_status: RoomStatus;
  final_quests: FinalQuest[];
}

/** 최종 퀘스트 확정 미리보기 — 동점 여부 확인 */
export const fetchFinalQuestPreview = async (
  roomId: number,
): Promise<FinalQuestPreview> =>
  api.get<FinalQuestPreview>(`/rooms/${roomId}/final-quests/preview`);

/** 동점 후보 선택 (방장) */
export const submitTieBreak = async (
  roomId: number,
  selectedCandidateIds: number[],
): Promise<void> => {
  await api.post(`/rooms/${roomId}/final-quests/tie-break`, {
    selected_candidate_ids: selectedCandidateIds,
  });
};

/** 최종 퀘스트 확정 (방장) — 동점이 있으면 동점 후보 선택 후 호출 */
export const confirmFinalQuests = async (
  roomId: number,
): Promise<FinalQuestConfirmResult> =>
  api.post<FinalQuestConfirmResult>(`/rooms/${roomId}/final-quests`);

/**
 * 확정된 퀘스트 조회 (참가자 / 재진입한 방장)
 * - 전용 API가 없어 미리보기를 사용한다. BE는 확정 후 미리보기에 확정된 퀘스트를 순위대로 돌려준다.
 * - 반드시 방 상태가 QUEST_CONFIRMED 이후일 때만 호출 (확정 전에는 예상 결과가 온다)
 * - 미리보기에는 확정 퀘스트 번호와 선정 사유가 없어 후보 번호로 대신하고 사유는 득표 순위로 둔다
 *   (화면에서는 목록 key로만 쓰며, 진행 화면은 진행 조회의 final_quest_id를 쓴다)
 */
export const fetchFinalQuests = async (roomId: number): Promise<FinalQuest[]> => {
  const preview = await fetchFinalQuestPreview(roomId);
  return (preview.final_quest_candidates ?? []).map((candidate, index) => ({
    final_quest_id: candidate.candidate_id,
    rank_no: candidate.rank_no ?? index + 1,
    quest_title: candidate.quest_title,
    vote_count: candidate.vote_count,
    selection_reason: "VOTE_RANK",
  }));
};
