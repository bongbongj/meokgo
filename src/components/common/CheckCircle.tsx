// src/components/common/CheckCircle.tsx
// 체크 원 (개발 가이드 5장: 26px, 미선택 테두리 1.5px #D4D4D4)

import React from "react";
import { StyleSheet, View } from "react-native";
import { COLORS } from "../../constants/colors";
import { scale } from "../../utils/responsive";
import Icon from "./Icon";

interface CheckCircleProps {
  checked: boolean;
  size?: number;
}

export default function CheckCircle({ checked, size = 26 }: CheckCircleProps) {
  const diameter = scale(size);

  return (
    <View
      style={[
        styles.circle,
        { width: diameter, height: diameter, borderRadius: diameter / 2 },
        checked ? styles.checked : styles.unchecked,
      ]}
    >
      {checked && (
        // Figma 09_퀘스트 투표: 26px 원 안에 14px 체크 — 원 크기에 맞춰 같은 비율로
        <Icon name="checkBold" size={(diameter * 14) / 26} color={COLORS.background} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  circle: { justifyContent: "center", alignItems: "center" },
  checked: { backgroundColor: COLORS.primary },
  unchecked: {
    backgroundColor: COLORS.background,
    borderWidth: 1.5,
    borderColor: COLORS.emptyCircleBorder,
  },
});
