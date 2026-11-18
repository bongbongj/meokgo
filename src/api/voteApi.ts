// src/api/voteApi.ts
// FE2 — 퀘스트 후보 조회, 투표 저장 / 수정, 투표 현황 (API명세서 8장, 9장)

import { api, isApiError } from "./client";
import { fetchRoomDetail as fetchRoomDetailFromServer } from "./roomApi";
import type { RoomDetail } from "./roomApi";
import type { QuestType, RoomStatus } from "./types";

export interface QuestCandidate {
  candidate_id: number;
  quest_id?: number;
  quest_title: string;
  quest_description: string;
  quest_type: QuestType;
  candidate_order?: number;
  selected: boolean; // 내가 선택한 후보인지 (투표 수정 시 기존 선택 복원)
  vote_count: number;
}

export interface QuestCandidateList {
  candidate_count: number;
  need_condition_reset: boolean;
  min_select_count: number;
  max_select_count: number;
  candidates: QuestCandidate[];
}

export interface MyVoteResult {
  room_id: number;
  voted?: boolean;
  candidate_ids: number[];
}

export interface VoteStatusParticipant {
  participant_id: number;
  nickname: string;
  voted: boolean;
}

export interface VoteStatus {
  total_participant_count: number;
  voted_participant_count: number;
  selected_count: number;
  max_select_count: number;
  vote_status_text: string;
  push_notification_enabled: boolean;
  participants: VoteStatusParticipant[];
  candidate_results: {
    candidate_id: number;
    quest_title: string;
    vote_count: number;
  }[];
}

export interface VoteClosePreview {
  not_voted_participant_count: number;
  confirmation_required: boolean;
  reopen_supported: boolean;
  top_candidates: {
    candidate_id: number;
    quest_title: string;
    vote_count: number;
  }[];
}

export interface VoteCloseResult {
  room_id: number;
  room_status: RoomStatus;
  not_voted_participant_count: number;
  reopen_supported: boolean;
}

export interface RoomState {
  room_status: RoomStatus;
  is_host: boolean;
}

/**
 * 후보 퀘스트 조회
 * 후보가 아직 생성되지 않았으면(QUEST-002) 생성 후 다시 조회한다. (생성 API는 중복 호출해도 기존 후보 유지)
 */
export const fetchQuestCandidates = async (
  roomId: number,
): Promise<QuestCandidateList> => {
  const path = `/rooms/${roomId}/quest-candidates`;
  try {
    return await api.get<QuestCandidateList>(path);
  } catch (error) {
    if (!isApiError(error) || error.code !== "QUEST-002") throw error;
    await api.post(path);
    return api.get<QuestCandidateList>(path);
  }
};

/**
 * 내 투표 저장 / 수정
 * 이미 투표한 상태(isEdit)면 PUT, 처음이면 POST
 */
export const submitMyVote = async (
  roomId: number,
  candidateIds: number[],
  isEdit: boolean,
): Promise<MyVoteResult> => {
  const path = `/rooms/${roomId}/votes/me`;
  const body = { candidate_ids: candidateIds };
  return isEdit
    ? api.put<MyVoteResult>(path, body)
    : api.post<MyVoteResult>(path, body);
};

/** 투표 현황 조회 */
export const fetchVoteStatus = async (roomId: number): Promise<VoteStatus> => {
  return api.get<VoteStatus>(`/rooms/${roomId}/votes/status`);
};

/** 투표 마감 확인 정보 조회 */
export const fetchVoteClosePreview = async (
  roomId: number,
): Promise<VoteClosePreview> => {
  return api.get<VoteClosePreview>(`/rooms/${roomId}/votes/close-preview`);
};

/** 투표 마감 — 방장이 확인창을 승인한 뒤 호출 */
export const closeVote = async (roomId: number): Promise<VoteCloseResult> => {
  return api.post<VoteCloseResult>(`/rooms/${roomId}/votes/close`, {
    confirmed: true,
  });
};

/**
 * 방 상태와 내 방장 여부 조회
 * - 방장이면 09-1 투표 현황, 아니면 10 투표 대기를 보여준다
 * - 투표 마감 시 퀘스트 확정 화면으로 자동 전환하는 데 사용
 */
export const fetchRoomState = async (roomId: number): Promise<RoomState> => {
  const data = await api.get<RoomState>(`/rooms/${roomId}/waiting-status`);
  return { room_status: data.room_status, is_host: data.is_host };
};

export type { RoomDetail };

/** 탐험방 상세 조회 (10-1 퀘스트 확정의 탐험 요약 카드) — roomApi.ts의 조회를 그대로 사용 */
export const fetchRoomDetail = async (roomId: number): Promise<RoomDetail> =>
  (await fetchRoomDetailFromServer(roomId)).data;
