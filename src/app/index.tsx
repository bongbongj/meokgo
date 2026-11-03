import React, { useEffect } from "react";
import SplashScreen from "../screens/SplashScreen";
import { router } from "expo-router";
import { getStoredNickname } from "../utils/userStorage";

const SPLASH_MIN_DURATION = 1500; // 스플래시 최소 노출 1.5초 (1~2초)

export default function Index() {
  useEffect(() => {
    let ignore = false;

    // 최초 실행 → 닉네임 설정, 그 외 → 홈 (뒤로가기로 돌아올 수 없도록 replace)
    Promise.all([
      getStoredNickname(),
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
