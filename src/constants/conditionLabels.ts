// src/constants/conditionLabels.ts

import type { DrinkingOption, ScheduleType } from "../api/roomApi";

export const SCHEDULE_OPTIONS: { value: ScheduleType; label: string }[] = [
  { value: "MEAL", label: "식사" },
  { value: "CAFE", label: "카페" },
  { value: "PUB", label: "술집" },
  { value: "SECOND_ROUND", label: "2차" },
];

export const DRINKING_OPTIONS: { value: DrinkingOption; label: string }[] = [
  { value: "NONE", label: "마시지않음" },
  { value: "AVAILABLE", label: "가능" },
  { value: "ANY", label: "상관없음" },
];

// 탐험 요약용 문구: 식사 · 음주 가능 · 매운 음식 제외
export const formatConditionSummary = (condition: {
  schedule_type: ScheduleType;
  drinking_option: DrinkingOption;
  avoid_foods?: string | null;
}) => {
  const parts = [
    SCHEDULE_OPTIONS.find((o) => o.value === condition.schedule_type)?.label,
    condition.drinking_option === "AVAILABLE"
      ? "음주 가능"
      : condition.drinking_option === "NONE"
        ? "음주 안 함"
        : null,
    condition.avoid_foods ? `${condition.avoid_foods} 제외` : null,
  ];
  return parts.filter(Boolean).join(" · ");
};
