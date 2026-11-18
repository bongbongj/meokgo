// src/api/regionApi.ts

import { toResponse } from "./apiError";
import { api } from "./client";

// 상위 지역(시·도)은 parent_region_id가 null, 하위 지역은 상위 지역의 region_id
// (현재 BE 지역 데이터는 상위 지역 없이 모두 parent_region_id가 null)
export interface Region {
  region_id: number;
  region_name: string;
  parent_region_id: number | null;
  region_image_url: string | null; // 지역 대표 이미지 (없으면 null → 회색 기본 이미지)
}

export interface RecentRegion {
  region_id: number;
  region_name: string;
  selected_at: string;
  region_image_url: string | null; // 지역 대표 이미지
}

/**
 * 지역 검색 및 분류 조회 API
 * GET /api/v1/regions?keyword=&parent_region_id=
 * - 조건이 없으면 전체 지역, keyword가 있으면 이름 검색, parent_region_id가 있으면 하위 지역
 */
export const fetchRegions = async (params: {
  keyword?: string;
  parent_region_id?: number;
}): Promise<{ success: boolean; data: { regions: Region[] } }> => {
  const query = new URLSearchParams();
  if (params.keyword?.trim()) query.set("keyword", params.keyword.trim());
  if (params.parent_region_id)
    query.set("parent_region_id", String(params.parent_region_id));
  const qs = query.toString();
  return toResponse(api.get<{ regions: Region[] }>(`/regions${qs ? `?${qs}` : ""}`));
};

/**
 * 지역명 → 지역 대표 이미지 주소
 * - 기록 응답에는 지역 이미지가 없어서 전체 지역 목록(GET /api/v1/regions)으로 찾는다
 * - 이미지가 등록된 지역만 담는다
 * - TODO: BE 기록 목록·상세 응답에 region_image_url이 생기면 그 값을 쓴다
 */
export const fetchRegionImageUrls = async (): Promise<Map<string, string>> => {
  const res = await fetchRegions({});
  const images = new Map<string, string>();
  for (const region of res.data.regions) {
    if (region.region_image_url) images.set(region.region_name, region.region_image_url);
  }
  return images;
};

/**
 * 최근 선택 지역 조회 API
 * GET /api/v1/users/me/recent-regions
 */
export const fetchRecentRegions = async (): Promise<{
  success: boolean;
  data: { recent_regions: RecentRegion[] };
}> =>
  toResponse(api.get<{ recent_regions: RecentRegion[] }>("/users/me/recent-regions"));
