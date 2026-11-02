// src/components/dev/ScreenPlaceholder.tsx
// 아직 구현하지 않은 화면의 임시 표시용 (라우트 연결 확인)
// 화면을 구현하면 해당 화면에서 이 컴포넌트를 제거한다.

import React from "react";
import { StyleSheet, Text, SafeAreaView } from "react-native";
import { COLORS } from "../../constants/colors";

interface ScreenPlaceholderProps {
  title: string; // 예: "07. 퀘스트 투표"
  params?: Record<string, string | number | undefined>;
}

export default function ScreenPlaceholder({
  title,
  params,
}: ScreenPlaceholderProps) {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {params &&
        Object.entries(params).map(([key, value]) => (
          <Text key={key} style={styles.param}>
            {key}: {String(value)}
          </Text>
        ))}
      <Text style={styles.caption}>준비 중인 화면입니다.</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.textMain,
    marginBottom: 8,
  },
  param: {
    fontSize: 13,
    color: COLORS.textSub,
  },
  caption: {
    marginTop: 16,
    fontSize: 12,
    color: COLORS.textMuted,
  },
});
