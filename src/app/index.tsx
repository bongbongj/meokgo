import React, { useEffect } from "react";
import SplashScreen from "../screens/SplashScreen";
import { router } from "expo-router";

export default function Index() {
  useEffect(() => {
    // 1.5초 동안 진입 화면(스플래시) 표시 후 닉네임 설정 화면으로 이동
    const timer = setTimeout(() => {
      router.replace("/nickname");
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  return <SplashScreen />;
}
