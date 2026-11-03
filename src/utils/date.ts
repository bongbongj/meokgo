// src/utils/date.ts
// 화면 표시용 날짜 포맷

const pad = (value: number) => String(value).padStart(2, "0");

/** 2026. 09. 14 형식 (서버 ISO 문자열 또는 Date) */
export const formatDotDate = (value: string | Date = new Date()): string => {
  const date = typeof value === "string" ? new Date(value) : value;
  return `${date.getFullYear()}. ${pad(date.getMonth() + 1)}. ${pad(date.getDate())}`;
};

/** 2026.09.14 형식 (02 홈 최근 탐험 카드) */
export const formatCompactDotDate = (value: string | Date = new Date()): string => {
  const date = typeof value === "string" ? new Date(value) : value;
  return `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())}`;
};
