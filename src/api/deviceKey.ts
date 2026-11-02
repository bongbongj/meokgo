// src/api/deviceKey.ts
// 기기 기반 사용자 식별 키 (X-Device-Key)
// 최초 실행 시 UUID를 만들어 저장하고, 이후에는 저장된 값을 재사용한다.

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";

const STORAGE_KEY = "meokgo.deviceKey";

let cachedKey: string | null = null;
let pending: Promise<string> | null = null;

const loadOrCreate = async (): Promise<string> => {
  const saved = await AsyncStorage.getItem(STORAGE_KEY);
  if (saved) return saved;

  const created = Crypto.randomUUID();
  await AsyncStorage.setItem(STORAGE_KEY, created);
  return created;
};

/**
 * 기기 키 조회 (없으면 생성)
 * 앱 시작 직후 여러 요청이 동시에 들어와도 키는 하나만 만들어진다.
 */
export const getDeviceKey = async (): Promise<string> => {
  if (cachedKey) return cachedKey;

  if (!pending) {
    pending = loadOrCreate()
      .then((key) => {
        cachedKey = key;
        return key;
      })
      .finally(() => {
        pending = null;
      });
  }
  return pending;
};
