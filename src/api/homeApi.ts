// src/api/homeApi.ts

export type HomeMockType = "EMPTY" | "ACTIVE" | "VOTING";

export interface ActiveRoom {
  room_id: number;
  room_status: "WAITING" | "VOTING" | "IN_PROGRESS";
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
  created_at: string;
}

export interface PopularRegion {
  region_id: number;
  region_name: string;
  exploration_count: number;
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

// 3가지 상태별 더미 데이터 세트
const MOCK_DATA_SETS: Record<HomeMockType, HomeData> = {
  // 1. 탐험 없음
  EMPTY: {
    active_room: null,
    recent_records: [],
    popular_regions: [
      { region_id: 1, region_name: "행궁동", exploration_count: 15 },
      { region_id: 2, region_name: "성수동", exploration_count: 12 },
      { region_id: 3, region_name: "을지로", exploration_count: 9 },
      { region_id: 4, region_name: "망원동", exploration_count: 8 },
    ],
  },

  // 2. 탐험 진행 중
  ACTIVE: {
    active_room: {
      room_id: 10,
      room_status: "IN_PROGRESS",
      region_name: "행궁동",
      participant_count: 4,
      completed_quest_count: 1,
      total_quest_count: 3,
    },
    recent_records: [
      {
        record_id: 1,
        region_name: "망원동",
        completed_quest_count: 3,
        created_at: "2026.09.10",
      },
      {
        record_id: 2,
        region_name: "성수동",
        completed_quest_count: 2,
        created_at: "2026.04.22",
      },
    ],
    popular_regions: [],
  },

  // 3. 투표 진행 중 (인원수와 투표완료 수에 따라 바가 유연하게 변경됨)
  VOTING: {
    active_room: {
      room_id: 11,
      room_status: "VOTING",
      region_name: "행궁동",
      participant_count: 4, // 총 친구 수 (바의 전체 개수)
      voted_participant_count: 3, // 투표 완료 수 (흰색으로 채워지는 개수)
      completed_quest_count: 2,
      total_quest_count: 3,
    },
    recent_records: [
      {
        record_id: 1,
        region_name: "망원동",
        completed_quest_count: 3,
        created_at: "2026.09.10",
      },
      {
        record_id: 2,
        region_name: "성수동",
        completed_quest_count: 2,
        created_at: "2026.04.22",
      },
    ],
    popular_regions: [],
  },
};

/**
 * 홈 화면 데이터 조회 API (더미)
 * 나중에 실제 서버 연결 시 fetch/axios로 교체됨
 */
export const fetchHomeData = async (
  type: HomeMockType = "VOTING",
): Promise<HomeResponse> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        data: MOCK_DATA_SETS[type],
      });
    }, 200);
  });
};
