// src/api/voteApi.ts
// FE2 — 퀘스트 후보 조회, 투표 저장 / 수정, 투표 현황 (API명세서 8장, 9장)

import { api, isApiError } from "./client";
import { mockResolve, USE_MOCK } from "./mock";
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

// BE 미구현 API — 구현되면 false로 바꾸고 USE_MOCK.vote를 따르게 한다
const VOTE_STATUS_API_PENDING = true;

// ---------------------------------------------------------------------------
// 더미 데이터 (API명세서 응답 구조 그대로)
// 투표 저장 후 후보 조회 / 투표 현황에 반영되도록 내 선택을 기억해 둔다.
// ---------------------------------------------------------------------------
const MOCK_CANDIDATE_TITLES: [string, string][] = [
  ["모두 처음 가는 식당 찾기", "오늘의 탐험 지역에서 모두 처음 가보는 식당을 찾아보세요."],
  ["골목 안쪽 가게 찾아보기", "큰길보다 골목 안쪽에 있는 가게를 선택해보세요."],
  ["메인 메뉴를 친구가 골라주기", "내 메인 메뉴를 친구가 대신 골라주세요."],
  ["첫 장소와 다른 분위기 찾기", "첫 번째 장소와 전혀 다른 분위기의 가게로 가보세요."],
  ["지난번과 다른 음식 문화권", "지난 탐험과 다른 나라의 음식을 골라보세요."],
  ["메뉴가 5개 이하인 가게 찾기", "메뉴판에 메뉴가 5개 이하인 가게를 찾아보세요."],
];

let mockMySelection: number[] = [];

const mockCandidates = (): QuestCandidateList => ({
  candidate_count: MOCK_CANDIDATE_TITLES.length,
  need_condition_reset: false,
  min_select_count: 1,
  max_select_count: 3,
  candidates: MOCK_CANDIDATE_TITLES.map(([title, description], index) => ({
    candidate_id: index + 1,
    quest_title: title,
    quest_description: description,
    quest_type: "COMMON",
    candidate_order: index + 1,
    selected: mockMySelection.includes(index + 1),
    vote_count: 0,
  })),
});

const mockVoteStatus = (): VoteStatus => {
  const participants: VoteStatusParticipant[] = [
    { participant_id: 1, nickname: "민교", voted: true },
    { participant_id: 2, nickname: "서연", voted: true },
    { participant_id: 3, nickname: "현진", voted: false },
  ];
  const voted = participants.filter((p) => p.voted).length;
  return {
    total_participant_count: participants.length,
    voted_participant_count: voted,
    selected_count: mockMySelection.length,
    max_select_count: 3,
    vote_status_text: `${participants.length}명 중 ${voted}명 투표 완료`,
    push_notification_enabled: false,
    participants,
    candidate_results: [],
  };
};

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

/**
 * 후보 퀘스트 조회
 * 후보가 아직 생성되지 않았으면(QUEST-002) 생성 후 다시 조회한다. (생성 API는 중복 호출해도 기존 후보 유지)
 */
export const fetchQuestCandidates = async (
  roomId: number,
): Promise<QuestCandidateList> => {
  if (USE_MOCK.questCandidate) return mockResolve(mockCandidates());

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
  if (USE_MOCK.vote) {
    mockMySelection = [...candidateIds];
    return mockResolve({ room_id: roomId, voted: true, candidate_ids: candidateIds });
  }

  const path = `/rooms/${roomId}/votes/me`;
  const body = { candidate_ids: candidateIds };
  return isEdit
    ? api.put<MyVoteResult>(path, body)
    : api.post<MyVoteResult>(path, body);
};

/** 투표 현황 조회 (BE 미구현 — 현재 더미) */
export const fetchVoteStatus = async (roomId: number): Promise<VoteStatus> => {
  if (VOTE_STATUS_API_PENDING || USE_MOCK.vote) {
    return mockResolve(mockVoteStatus());
  }
  return api.get<VoteStatus>(`/rooms/${roomId}/votes/status`);
};

/**
 * 방 상태 조회 — 투표 마감 시 퀘스트 확정 화면으로 자동 전환하는 데 사용
 * TODO: FE1의 roomApi.ts가 생기면 그쪽 함수로 교체
 */
export const fetchRoomStatus = async (roomId: number): Promise<RoomStatus> => {
  if (USE_MOCK.room) return mockResolve<RoomStatus>("VOTING");

  const data = await api.get<{ room_status: RoomStatus }>(
    `/rooms/${roomId}/waiting-status`,
  );
  return data.room_status;
};
