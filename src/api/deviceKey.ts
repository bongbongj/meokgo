// src/api/deviceKey.ts
// 기기 기반 사용자 식별 키 (X-Device-Key)
// 최초 실행 시 UUID를 만들어 저장하고, 이후에는 저장된 값을 재사용한다.
// - 웹은 AsyncStorage가 같은 키로 localStorage에 저장하므로 새로고침·재접속해도 같은 값을 쓴다
// - 저장소를 쓸 수 없는 환경(사파리 프라이빗 모드 등)에서는 메모리 값으로 동작한다
//   (이 경우 탭을 닫으면 키가 바뀌어 다른 사용자로 인식된다)

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";

const STORAGE_KEY = "meokgo.deviceKey";

let cachedKey: string | null = null;
let pending: Promise<string> | null = null;

const toHex = (byte: number) => byte.toString(16).padStart(2, "0");

/**
 * UUID v4 생성
 * - randomUUID는 웹에서 보안 컨텍스트(https, localhost)에서만 쓸 수 있으므로
 *   실패하면 crypto.getRandomValues로 직접 만든다
 */
const createUuid = (): string => {
  try {
    return Crypto.randomUUID();
  } catch {
    // 아래 fallback 사용
  }

  const bytes = new Uint8Array(16);
  if (typeof globalThis.crypto?.getRandomValues === "function") {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    // crypto 자체가 없는 아주 오래된 환경용 (식별용 키라 보안 강도는 요구하지 않음)
    for (let i = 0; i < bytes.length; i += 1) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant 10xx

  const hex = Array.from(bytes, toHex).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
};

const readSavedKey = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
};

const saveKey = async (key: string) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, key);
  } catch {
    // 저장에 실패해도 이번 실행 동안은 메모리 값(cachedKey)으로 동작
  }
};

const loadOrCreate = async (): Promise<string> => {
  const saved = await readSavedKey();
  if (saved) return saved;

  const created = createUuid();
  await saveKey(created);
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
