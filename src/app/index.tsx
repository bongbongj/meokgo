import React, { useEffect } from "react";
import SplashScreen from "../screens/SplashScreen";
import { router } from "expo-router";
import { fetchBootstrap } from "../api/userApi";
import { getStoredNickname, saveStoredNickname } from "../utils/userStorage";

const SPLASH_MIN_DURATION = 1500; // 스플래시 최소 노출 1.5초 (1~2초)

/**
 * 서버에 등록된 닉네임 조회
 * 서버에 연결하지 못하면 기기에 저장된 닉네임으로 대신한다. (오프라인에서도 홈까지는 진입)
 */
const resolveNickname = async (): Promise<string | null> => {
  try {
    const { nickname } = await fetchBootstrap();
    if (nickname) await saveStoredNickname(nickname);
    return nickname;
  } catch {
    return getStoredNickname();
  }
};

export default function Index() {
  useEffect(() => {
    let ignore = false;

    // 최초 실행 → 닉네임 설정, 그 외 → 홈 (뒤로가기로 돌아올 수 없도록 replace)
    Promise.all([
      resolveNickname(),
      new Promise((resolve) => setTimeout(resolve, SPLASH_MIN_DURATION)),
    ]).then(([nickname]) => {
      if (ignore) return;
      router.replace(nickname ? "/home" : "/nickname");
    });

    return () => {
      ignore = true;
    };
  }, []);

  return <SplashScreen />;
}
