// src/utils/roomNavigation.ts
// 진행 중인 탐험방의 상태별 이동 화면 (FE 협업 규칙 4.3)
// - 홈 이어하기, 초대 링크로 다시 들어온 기존 참여자 복귀에서 함께 사용

import type { Href } from "expo-router";
import type { RoomStatus } from "../api/types";

/** 방 상태에 맞는 화면 경로. 종료·만료된 방이면 null */
export const activeRoomHref = (roomId: number, roomStatus: RoomStatus): Href | null => {
  switch (roomStatus) {
    case "WAITING":
      return { pathname: "/waiting/[roomId]", params: { roomId: String(roomId) } };
    case "VOTING":
      return `/rooms/${roomId}/vote-status`;
    case "VOTE_CLOSED":
    case "QUEST_CONFIRMED":
      return `/rooms/${roomId}/confirm`;
    case "IN_PROGRESS":
      return `/rooms/${roomId}/progress`;
    default:
      return null;
  }
};
