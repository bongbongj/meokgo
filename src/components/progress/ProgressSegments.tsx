// src/components/progress/ProgressSegments.tsx
// 퀘스트 진행바 — 퀘스트 수만큼 칸을 나누고 완료한 수만큼 코랄로 채운다 (10-2: 3칸, 높이 6)

import React from "react";
import { StyleSheet, View } from "react-native";
import { COLORS } from "../../constants/colors";
import { scale, verticalScale } from "../../utils/responsive";

interface ProgressSegmentsProps {
  total: number;
  completed: number;
}

export default function ProgressSegments({ total, completed }: ProgressSegmentsProps) {
  return (
    <View style={styles.row}>
      {Array.from({ length: total }, (_, index) => (
        <View
          key={index}
          style={[styles.segment, index < completed ? styles.filled : styles.empty]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: scale(6) },
  segment: {
    flex: 1,
    height: verticalScale(6),
    borderRadius: verticalScale(3),
  },
  filled: { backgroundColor: COLORS.primary },
  empty: { backgroundColor: COLORS.trackBg },
});
