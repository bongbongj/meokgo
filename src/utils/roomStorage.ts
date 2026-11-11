// src/utils/roomStorage.ts
// 탐험방별 기기 로컬 저장
// - 초대 링크는 방 생성 응답에만 있어, 07 참여 대기에 다시 들어와도 보여줄 수 있도록 저장해 둔다

import AsyncStorage from "@react-native-async-storage/async-storage";

const inviteUrlKey = (roomId: number) => `room.inviteUrl.${roomId}`;

export const saveInviteUrl = async (roomId: number, inviteUrl: string) => {
  try {
    await AsyncStorage.setItem(inviteUrlKey(roomId), inviteUrl);
  } catch {
    // 저장 실패 시 참여 대기에서 초대 링크가 보이지 않을 뿐이므로 무시
  }
};

export const getInviteUrl = async (roomId: number): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(inviteUrlKey(roomId));
  } catch {
    return null;
  }
};
