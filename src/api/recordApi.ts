// src/api/recordApi.ts
// FE2 — 사용자 통계, 탐험 기록 목록 / 상세 (API명세서 12장)

import { ImageSourcePropType } from "react-native";
import { api, ApiError } from "./client";
import { mockRecordIdOf } from "./explorationApi";
import { fetchFinalQuests } from "./finalQuestApi";
import { mockResolve, USE_MOCK } from "./mock";
import { getFinishedMockRoomIds } from "./mockRooms";
import type { RetentionStage } from "./types";

export interface UserStatistics {
  completed_exploration_count: number;
  completed_quest_count: number;
  visited_region_count: number;
  retention_stages: {
    stage_code: RetentionStage;
    stage_name: string;
    achieved: boolean;
    reward_description: string;
  }[];
}

export interface RecordSummary {
  record_id: number;
  region_name: string;
  participant_count: number;
  completed_quest_count: number;
  created_at: string;
  // API명세서에 없음 — 11 내 기록 카드의 대표 사진 (BE 협의, README 컨펌 필요 사항)
  thumbnail_url?: string | null;
}

export interface RecordList {
  records: RecordSummary[];
  has_next: boolean;
}

export interface RecordPhoto {
  photo_id: number;
  photo_url: string;
}

export interface RecordDetail {
  record_id: number;
  region_name: string;
  created_at: string;
  participants: string[];
  completed_quests: { quest_title: string; completed: boolean }[];
  photos: RecordPhoto[];
}

// BE 미구현 API — 구현되면 false로 바꾸고 USE_MOCK.record를 따르게 한다
const RECORD_API_PENDING = true;

const isMocked = () => RECORD_API_PENDING || USE_MOCK.record;

// ---------------------------------------------------------------------------
// 더미 데이터 (디자인 시안 기준: 망원 / 성수 / 행궁 / 문래, 15는 을지로)
// - 더미 사진은 로컬 이미지라 photo_url 대신 mock:// 키를 쓰고 getPhotoSource()로 바꾼다
// - 14 빈 상태 확인: setMockRecordsEmpty(true) (11 화면의 개발용 전환 버튼)
// - 10-2에서 종료한 탐험은 기록 목록 맨 앞에 추가된다
// ---------------------------------------------------------------------------
const MOCK_PHOTOS: Record<string, ImageSourcePropType> = {
  "mock://mangwon": require("../../assets/images/mock/mangwon.png"),
  "mock://seongsu": require("../../assets/images/mock/seongsu.png"),
  "mock://haenggung": require("../../assets/images/mock/haenggung.jpg"),
  "mock://mullae": require("../../assets/images/mock/mullae.jpg"),
  "mock://euljiro-night": require("../../assets/images/mock/euljiro-night.jpg"),
  "mock://euljiro-golbaengi": require("../../assets/images/mock/euljiro-golbaengi.jpg"),
  "mock://euljiro-street": require("../../assets/images/mock/euljiro-street.jpg"),
  "mock://euljiro-food": require("../../assets/images/mock/euljiro-food.jpg"),
  "mock://friends": require("../../assets/images/mock/friends.jpg"),
  "mock://beer": require("../../assets/images/mock/beer.jpg"),
};

/** photo_url → Image source (더미 키는 로컬 이미지, 그 외는 원격 주소) */
export const getPhotoSource = (url: string): ImageSourcePropType =>
  MOCK_PHOTOS[url] ?? { uri: url };

const MOCK_QUESTS = ["모두 처음 가는 식당 가기", "친구가 메인 메뉴 골라주기", "디저트는 다른 골목에서 먹기"];
const MOCK_PARTICIPANTS = ["민교", "서연", "현진"];

const MOCK_RECORDS: (RecordSummary & { photos: string[] })[] = [
  {
    record_id: 4,
    region_name: "망원동",
    participant_count: 3,
    completed_quest_count: 3,
    created_at: "2026-09-10T20:30:00",
    thumbnail_url: "mock://mangwon",
    photos: ["mock://mangwon", "mock://euljiro-food", "mock://beer"],
  },
  {
    record_id: 3,
    region_name: "성수동",
    participant_count: 4,
    completed_quest_count: 3,
    created_at: "2026-08-01T19:00:00",
    thumbnail_url: "mock://seongsu",
    photos: ["mock://seongsu", "mock://friends"],
  },
  {
    record_id: 2,
    region_name: "행궁동",
    participant_count: 3,
    completed_quest_count: 3,
    created_at: "2026-06-10T13:00:00",
    thumbnail_url: "mock://haenggung",
    photos: ["mock://haenggung"],
  },
  {
    record_id: 1,
    region_name: "문래동",
    participant_count: 2,
    completed_quest_count: 3,
    created_at: "2026-02-18T18:30:00",
    thumbnail_url: "mock://mullae",
    photos: [],
  },
];

// 15 디자인 시안 — 10-2에서 종료한 탐험의 기록으로 사용
const MOCK_EULJIRO_PHOTOS = [
  "mock://euljiro-night",
  "mock://euljiro-golbaengi",
  "mock://euljiro-street",
  "mock://euljiro-food",
];

let mockEmpty = false;

export const setMockRecordsEmpty = (empty: boolean) => {
  mockEmpty = empty;
};
export const isMockRecordsEmpty = () => mockEmpty;

const toPhotos = (urls: string[]): RecordPhoto[] =>
  urls.map((photo_url, index) => ({ photo_id: index + 1, photo_url }));

const mockRecordList = (): RecordSummary[] => {
  if (mockEmpty) return [];
  const finished: RecordSummary[] = getFinishedMockRoomIds().map((roomId) => ({
    record_id: mockRecordIdOf(roomId),
    region_name: "을지로",
    participant_count: 3,
    completed_quest_count: 3,
    created_at: new Date().toISOString(),
    thumbnail_url: MOCK_EULJIRO_PHOTOS[0],
  }));
  return [...finished, ...MOCK_RECORDS.map(({ photos: _photos, ...summary }) => summary)];
};

const mockRecordDetail = async (recordId: number): Promise<RecordDetail> => {
  const base = MOCK_RECORDS.find((r) => r.record_id === recordId);
  if (base) {
    return {
      record_id: base.record_id,
      region_name: base.region_name,
      created_at: base.created_at,
      participants: MOCK_PARTICIPANTS.slice(0, base.participant_count),
      completed_quests: MOCK_QUESTS.map((quest_title) => ({ quest_title, completed: true })),
      photos: toPhotos(base.photos),
    };
  }
  if (recordId <= 0) throw new ApiError("RECORD-001", "탐험 기록을 찾을 수 없어요.", 404);
  // 10-2에서 종료한 탐험 (record_id = 1000 + 방 번호) 또는 주소로 직접 연 기록 → 15 디자인 시안 내용
  const roomId = recordId - 1000;
  const quests =
    roomId > 0
      ? (await fetchFinalQuests(roomId)).map((q) => q.quest_title)
      : MOCK_QUESTS;
  return {
    record_id: recordId,
    region_name: "을지로",
    created_at: roomId > 0 ? new Date().toISOString() : "2026-09-14T21:00:00",
    participants: MOCK_PARTICIPANTS,
    completed_quests: quests.map((quest_title) => ({ quest_title, completed: true })),
    photos: toPhotos(MOCK_EULJIRO_PHOTOS),
  };
};

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

/** 사용자 통계 — 완료한 탐험 / 퀘스트, 방문 지역 수 */
export const fetchMyStatistics = async (): Promise<UserStatistics> => {
  if (isMocked()) {
    const records = mockRecordList();
    return mockResolve({
      completed_exploration_count: records.length,
      completed_quest_count: records.reduce((sum, r) => sum + r.completed_quest_count, 0),
      visited_region_count: new Set(records.map((r) => r.region_name)).size,
      retention_stages: [],
    });
  }
  return api.get<UserStatistics>("/users/me/statistics");
};

/** 탐험 기록 목록 (최신순) */
export const fetchMyRecords = async (page = 0, size = 20): Promise<RecordList> => {
  if (isMocked()) return mockResolve({ records: mockRecordList(), has_next: false });
  return api.get<RecordList>(`/users/me/records?page=${page}&size=${size}`);
};

/** 탐험 기록 상세 — 지역, 날짜, 참여자, 사진, 완료 퀘스트 */
export const fetchRecordDetail = async (recordId: number): Promise<RecordDetail> => {
  if (isMocked()) return mockResolve(await mockRecordDetail(recordId));
  return api.get<RecordDetail>(`/records/${recordId}`);
};
