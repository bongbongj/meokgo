// src/api/mockRooms.ts
// 더미 모드 전용 — 방 상태를 화면 사이에서 공유한다.
// (투표 마감 → 퀘스트 확정 → 탐험 시작 순서로 상태가 바뀌도록)
//
// 화면 확인용 방 번호 규칙
// - 홀수: 방장 / 짝수: 참가자
// - 100 미만: 투표 중(VOTING)에서 시작
// - 100 이상: 바로 10 퀘스트 확정을 볼 수 있도록
//     4의 배수 → 퀘스트 확정됨(QUEST_CONFIRMED), 그 외 → 투표 마감(VOTE_CLOSED)
// - 끝자리 3 (3, 13, 103 …): 최종 퀘스트 동점 발생

import type { RoomStatus } from "./types";

const statusByRoom = new Map<number, RoomStatus>();

const initialStatus = (roomId: number): RoomStatus => {
  if (roomId < 100) return "VOTING";
  return roomId % 4 === 0 ? "QUEST_CONFIRMED" : "VOTE_CLOSED";
};

export const getMockRoomStatus = (roomId: number): RoomStatus =>
  statusByRoom.get(roomId) ?? initialStatus(roomId);

export const setMockRoomStatus = (roomId: number, status: RoomStatus) => {
  statusByRoom.set(roomId, status);
};

export const isMockHost = (roomId: number): boolean => roomId % 2 === 1;

export const hasMockTie = (roomId: number): boolean => roomId % 10 === 3;
