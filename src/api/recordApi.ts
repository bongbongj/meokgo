// src/api/recordApi.ts
// FE2 — 사용자 통계, 탐험 기록 목록 / 상세 (API명세서 12장)

import { api } from "./client";
import { fetchRegionImageUrls } from "./regionApi";
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
  // API명세서에 없음 — 11 내 기록 카드의 대표 사진 (FE가 기록 상세·지역 목록으로 채움)
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
  // API명세서에 없음 — 사진을 올리기 전 대표 사진 자리에 보여줄 지역 대표 이미지 (FE가 지역 목록으로 채움)
  region_image_url?: string | null;
}

/** 사용자 통계 — 완료한 탐험 / 퀘스트, 방문 지역 수 */
export const fetchMyStatistics = async (): Promise<UserStatistics> =>
  api.get<UserStatistics>("/users/me/statistics");

/** 지역 대표 이미지 조회 — 실패해도 화면은 회색 기본 이미지로 보여주면 되므로 빈 결과 */
const loadRegionImages = () =>
  fetchRegionImageUrls().catch(() => new Map<string, string>());

/** 탐험 기록 목록 (최신순) */
export const fetchMyRecords = async (page = 0, size = 20): Promise<RecordList> => {
  const list = await api.get<RecordList>(`/users/me/records?page=${page}&size=${size}`);
  const records = await Promise.all(list.records.map(withThumbnail));
  return { ...list, records: await withRegionThumbnail(records) };
};

/**
 * 사진을 아직 올리지 않은 기록은 지역 대표 이미지를 썸네일로 쓴다
 * - 올린 사진이 있으면 그 사진이 우선 (withThumbnail에서 채움)
 * - 지역 목록은 사진 없는 기록이 있을 때만 한 번 조회한다
 */
const withRegionThumbnail = async (records: RecordSummary[]): Promise<RecordSummary[]> => {
  if (records.every((record) => record.thumbnail_url)) return records;
  const images = await loadRegionImages();
  return records.map((record) =>
    record.thumbnail_url
      ? record
      : { ...record, thumbnail_url: images.get(record.region_name) ?? null },
  );
};

/**
 * 기록 카드 썸네일 — 15 탐험 기록의 대표 사진(첫 번째 사진)과 같게
 * - BE 목록 응답에 thumbnail_url이 없어 기록 상세로 채운다 (기록 수만큼 요청이 늘어난다)
 * - 상세 조회에 실패하거나 사진이 없으면 null → withRegionThumbnail에서 지역 대표 이미지로 채움
 * - BE가 목록에 thumbnail_url을 주면 제거
 */
const withThumbnail = async (record: RecordSummary): Promise<RecordSummary> => {
  if (record.thumbnail_url) return record;
  try {
    const detail = await api.get<RecordDetail>(`/records/${record.record_id}`);
    return { ...record, thumbnail_url: detail.photos[0]?.photo_url ?? null };
  } catch {
    return { ...record, thumbnail_url: null };
  }
};

/**
 * 탐험 기록 상세 — 지역, 날짜, 참여자, 사진, 완료 퀘스트
 * - withRegionImage: 사진을 아직 올리지 않았으면 region_image_url에 지역 대표 이미지를 채운다
 *   (15 탐험 기록의 대표 사진 자리용, 다른 화면은 지역 목록을 따로 조회하지 않게 끈다)
 */
export const fetchRecordDetail = async (
  recordId: number,
  { withRegionImage = false }: { withRegionImage?: boolean } = {},
): Promise<RecordDetail> => {
  const detail = await api.get<RecordDetail>(`/records/${recordId}`);
  if (!withRegionImage || detail.photos.length > 0) return detail;
  const images = await loadRegionImages();
  return { ...detail, region_image_url: images.get(detail.region_name) ?? null };
};
