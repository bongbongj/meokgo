// src/api/homeApi.ts

import { api } from "./client";
import { fetchVoteStatus } from "./voteApi";
import type { RoomStatus } from "./types";

export interface ActiveRoom {
  room_id: number;
  room_status: RoomStatus;
  region_name: string;
  participant_count: number;
  voted_participant_count?: number; // 투표 진행 중일 때 투표 완료 인원
  completed_quest_count: number;
  total_quest_count: number;
}

export interface RecentRecord {
  record_id: number;
  region_name: string;
  completed_quest_count: number;
  created_at: string; // ISO 8601 (화면에서 formatDotDate로 표시)
  thumbnail_url: string | null; // 기록 썸네일 (지금은 지역 대표 이미지)
}

export interface PopularRegion {
  region_id: number;
  region_name: string;
  exploration_count: number;
  region_image_url: string | null; // 지역 대표 이미지
}

export interface HomeData {
  active_room: ActiveRoom | null;
  recent_records: RecentRecord[];
  popular_regions: PopularRegion[];
}

export interface HomeResponse {
  success: boolean;
  data: HomeData;
}

/**
 * 02-2 투표 대기 카드의 투표 완료 인원
 * - BE 홈 응답에 voted_participant_count가 없어 투표 현황 API로 채운다
 * - 조회에 실패하면 0명으로 표시 (홈 전체는 그대로 보여준다)
 */
const withVotedCount = async (data: HomeData): Promise<HomeData> => {
  const room = data.active_room;
  if (!room || room.room_status !== "VOTING" || room.voted_participant_count != null) {
    return data;
  }
  const voted = await fetchVoteStatus(room.room_id).then(
    (status) => status.voted_participant_count,
    () => 0,
  );
  return { ...data, active_room: { ...room, voted_participant_count: voted } };
};

/**
 * 홈 화면 데이터 조회 API
 * GET /api/v1/home
 */
export const fetchHomeData = async (): Promise<HomeResponse> => {
  const data = await api.get<HomeData>("/home");
  return { success: true, data: await withVotedCount(data) };
};
