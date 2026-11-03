// src/utils/userStorage.ts

import AsyncStorage from "@react-native-async-storage/async-storage";

// 기기 로컬 저장 (01 닉네임 설정 화면정의: 닉네임, 최초 실행 여부 플래그)
const KEY_NICKNAME = "user.nickname";

/**
 * 저장된 기본 닉네임 (없으면 최초 실행)
 * 네트워크 없이도 스플래시에서 다음 화면을 정할 수 있도록 로컬에서만 읽음
 */
export const getStoredNickname = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(KEY_NICKNAME);
  } catch {
    return null;
  }
};

export const saveStoredNickname = async (nickname: string) => {
  try {
    await AsyncStorage.setItem(KEY_NICKNAME, nickname);
  } catch {
    // 저장 실패 시 다음 실행 때 닉네임 화면이 다시 나올 뿐이므로 무시
  }
};
