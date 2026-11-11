// src/api/regionApi.ts

import { mockResponse, toResponse } from "./apiError";
import { api } from "./client";
import { USE_MOCK } from "./mock";

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

// 시·도 카테고리 + 세부 지역 더미 데이터
const CITIES: [number, string, string[]][] = [
  [
    1,
    "서울",
    [
      "성수·서울숲",
      "연남·홍대",
      "망원·합정",
      "을지로·종로",
      "신당·약수",
      "한남·이태원",
      "익선동·안국",
      "서촌·경복궁",
      "문래·영등포",
      "강남역·신논현",
      "잠실·송리단길",
      "압구정·신사",
    ],
  ],
  [2, "경기·인천", ["행궁동", "판교", "송도", "일산"]],
  [3, "부산", ["서면·전포", "해운대", "광안리", "남포동"]],
  [4, "대전·세종", ["은행동", "소제동", "세종 나성동"]],
  [5, "대구", ["동성로", "김광석길"]],
  [6, "광주·전라", ["전주 한옥마을", "광주 동명동"]],
];

const MOCK_REGIONS: Region[] = CITIES.flatMap(([cityId, cityName, districts]) => [
  {
    region_id: cityId,
    region_name: cityName,
    parent_region_id: null,
    region_image_url: null,
  },
  ...districts.map((name, idx) => ({
    region_id: cityId * 100 + idx + 1,
    region_name: name,
    parent_region_id: cityId,
    region_image_url: null,
  })),
]);

const MOCK_RECENT_REGIONS: RecentRegion[] = [
  { region_id: 201, region_name: "행궁동", selected_at: "2026-10-06T01:00:00", region_image_url: null },
  { region_id: 101, region_name: "성수동", selected_at: "2026-10-05T01:00:00", region_image_url: null },
  { region_id: 104, region_name: "을지로", selected_at: "2026-10-04T01:00:00", region_image_url: null },
  { region_id: 103, region_name: "망원동", selected_at: "2026-10-03T01:00:00", region_image_url: null },
];

/**
 * 지역 검색 및 분류 조회 API
 * GET /api/v1/regions?keyword=&parent_region_id=
 * - 조건이 없으면 전체 지역, keyword가 있으면 이름 검색, parent_region_id가 있으면 하위 지역
 */
export const fetchRegions = async (params: {
  keyword?: string;
  parent_region_id?: number;
}): Promise<{ success: boolean; data: { regions: Region[] } }> => {
  if (!USE_MOCK.region) {
    const query = new URLSearchParams();
    if (params.keyword?.trim()) query.set("keyword", params.keyword.trim());
    if (params.parent_region_id)
      query.set("parent_region_id", String(params.parent_region_id));
    const qs = query.toString();
    return toResponse(api.get<{ regions: Region[] }>(`/regions${qs ? `?${qs}` : ""}`));
  }

  const keyword = params.keyword?.trim();
  let regions: Region[];

  if (keyword) {
    regions = MOCK_REGIONS.filter(
      (r) => r.parent_region_id !== null && r.region_name.includes(keyword),
    );
  } else if (params.parent_region_id) {
    regions = MOCK_REGIONS.filter(
      (r) => r.parent_region_id === params.parent_region_id,
    );
  } else {
    regions = MOCK_REGIONS;
  }

  return mockResponse({ success: true, data: { regions } }, 150);
};

/**
 * 최근 선택 지역 조회 API
 * GET /api/v1/users/me/recent-regions
 */
export const fetchRecentRegions = async (): Promise<{
  success: boolean;
  data: { recent_regions: RecentRegion[] };
}> => {
  if (!USE_MOCK.region) {
    return toResponse(
      api.get<{ recent_regions: RecentRegion[] }>("/users/me/recent-regions"),
    );
  }

  return mockResponse(
    { success: true, data: { recent_regions: MOCK_RECENT_REGIONS } },
    150,
  );
};
