import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false, // 상단 기본 헤더바 숨김
          animation: "fade", // 화면 전환 시 부드러운 페이드 효과
        }}
      >
        <Stack.Screen name="index" />
      </Stack>
    </>
  );
}
