// src/api/mockRooms.ts
// 더미 모드 전용 — 방 상태를 화면 사이에서 공유한다.
// (투표 마감 → 퀘스트 확정 → 탐험 시작 순서로 상태가 바뀌도록)
//
// 화면 확인용 방 번호 규칙
// - 홀수: 방장 / 짝수: 참가자
// - 100 미만: 투표 중(VOTING)에서 시작
// - 100 이상: 바로 10-1 퀘스트 확정을 볼 수 있도록
//     4의 배수 → 퀘스트 확정됨(QUEST_CONFIRMED), 그 외 → 투표 마감(VOTE_CLOSED)
// - 끝자리 3 (3, 13, 103 …): 최종 퀘스트 동점 발생
// - 03 조건 선택에서 만든 방 / 06 초대 링크로 참여한 방은 위 규칙 대신 실제 방장 여부와
//   투표 시작 상태(VOTING)를 사용 (roomApi.ts, inviteApi.ts에서 기록)

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

// 03 ~ 08 화면(roomApi / inviteApi 더미)에서 만들거나 참여한 방은 실제 역할을 따른다
const hostByRoom = new Map<number, boolean>();

export const setMockHost = (roomId: number, isHost: boolean) => {
  hostByRoom.set(roomId, isHost);
};

export const isMockHost = (roomId: number): boolean =>
  hostByRoom.get(roomId) ?? roomId % 2 === 1;

export const hasMockTie = (roomId: number): boolean => roomId % 10 === 3;
