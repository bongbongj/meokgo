// src/api/regionApi.ts

import { mockResponse } from "./apiError";

export type RegionLevel = "CITY" | "DISTRICT";

export interface Region {
  region_id: number;
  region_name: string;
  region_level: RegionLevel;
  parent_region_id: number | null;
}

export interface RecentRegion {
  region_id: number;
  region_name: string;
  selected_at: string;
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
    region_level: "CITY" as const,
    parent_region_id: null,
  },
  ...districts.map((name, idx) => ({
    region_id: cityId * 100 + idx + 1,
    region_name: name,
    region_level: "DISTRICT" as const,
    parent_region_id: cityId,
  })),
]);

const MOCK_RECENT_REGIONS: RecentRegion[] = [
  { region_id: 201, region_name: "행궁동", selected_at: "2026-10-06T01:00:00" },
  { region_id: 101, region_name: "성수동", selected_at: "2026-10-05T01:00:00" },
  { region_id: 104, region_name: "을지로", selected_at: "2026-10-04T01:00:00" },
  { region_id: 103, region_name: "망원동", selected_at: "2026-10-03T01:00:00" },
];

/**
 * 지역 검색 및 분류 조회 API (더미)
 * GET /api/v1/regions?keyword=&parent_region_id=
 */
export const fetchRegions = async (params: {
  keyword?: string;
  parent_region_id?: number;
}): Promise<{ success: boolean; data: { regions: Region[] } }> => {
  const keyword = params.keyword?.trim();
  let regions: Region[];

  if (keyword) {
    regions = MOCK_REGIONS.filter(
      (r) => r.region_level === "DISTRICT" && r.region_name.includes(keyword),
    );
  } else if (params.parent_region_id) {
    regions = MOCK_REGIONS.filter(
      (r) => r.parent_region_id === params.parent_region_id,
    );
  } else {
    regions = MOCK_REGIONS.filter((r) => r.region_level === "CITY");
  }

  return mockResponse({ success: true, data: { regions } }, 150);
};

/**
 * 최근 선택 지역 조회 API (더미)
 * GET /api/v1/users/me/recent-regions
 */
export const fetchRecentRegions = async (): Promise<{
  success: boolean;
  data: { recent_regions: RecentRegion[] };
}> => {
  return mockResponse(
    { success: true, data: { recent_regions: MOCK_RECENT_REGIONS } },
    150,
  );
};
