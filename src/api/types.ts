// src/api/types.ts
// API명세서.md 2장(공통 규칙) 기준 공통 타입

// 성공 응답: data 또는 message 중 하나가 내려옴
export interface ApiResponse<T> {
  success: true;
  data?: T;
  message?: string;
}

export interface ApiFieldError {
  field: string;
  value: unknown;
  reason: string;
}

// 오류 응답 본문 (API명세서 2.3)
export interface ApiErrorBody {
  timestamp: string;
  status: number;
  code: string;
  message: string;
  errors: ApiFieldError[];
  path: string;
}

// 서버 오류 코드 (API명세서 2.4) + 클라이언트 전용 코드
export type ApiErrorCode =
  | "COMMON-001"
  | "COMMON-002"
  | "USER-001"
  | "USER-002"
  | "REGION-001"
  | "ROOM-001"
  | "ROOM-002"
  | "ROOM-003"
  | "ROOM-004"
  | "ROOM-005"
  | "INVITE-001"
  | "INVITE-002"
  | "PARTICIPANT-001"
  | "PARTICIPANT-002"
  | "PARTICIPANT-003"
  | "QUEST-001"
  | "QUEST-002"
  | "QUEST-003"
  | "VOTE-001"
  | "VOTE-002"
  | "VOTE-003"
  | "VOTE-004"
  | "FINAL-001"
  | "RECORD-001"
  | "STORY-001"
  | "STORY-002"
  | "FILE-001"
  | "FILE-002"
  | "FILE-003"
  | "NETWORK" // 서버에 연결하지 못함
  | "TIMEOUT" // 응답 시간 초과
  | "UNKNOWN"; // 형식을 알 수 없는 오류 응답

// 주요 Enum (API명세서 2.5, BE 구현 기준)
export type ScheduleType = "MEAL" | "CAFE" | "PUB" | "SECOND_ROUND";
export type TimeSlot = "LUNCH" | "DINNER" | "LATE_NIGHT" | "ANY";
export type DrinkingOption = "NONE" | "AVAILABLE" | "ANY";
export type RoomStatus =
  | "WAITING"
  | "VOTING"
  | "VOTE_CLOSED"
  | "QUEST_CONFIRMED"
  | "IN_PROGRESS"
  | "FINISHED"
  | "EXPIRED";
export type ParticipantRole = "HOST" | "MEMBER";
export type ParticipantStatus =
  | "WAITING"
  | "VOTING"
  | "READY"
  | "EXPLORING"
  | "FINISHED"
  | "LEFT";
export type QuestType =
  | "COMMON"
  | "COOPERATIVE"
  | "TRANSITION"
  | "REVISIT";
export type VoteStatus = "OPEN" | "CLOSED";
export type FinalQuestSelectionReason = "VOTE_RANK" | "HOST_TIE_BREAK";
export type ProgressStatus = "TODO" | "DONE" | "CANCELED";
export type RetentionStage =
  | "FIRST_DISCOVERY"
  | "ALLEY_EXPLORER"
  | "REGION_MASTER";
export type InviteUnjoinableReason =
  | "EXPIRED"
  | "ALREADY_STARTED"
  | "FULL"
  | "INVALID_LINK"
  | "FINISHED";
