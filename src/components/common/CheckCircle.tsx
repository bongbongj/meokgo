// src/components/common/CheckCircle.tsx
// 체크 원 (개발 가이드 5장: 26px, 미선택 테두리 1.5px #D4D4D4)

import React from "react";
import { StyleSheet, View } from "react-native";
import { COLORS } from "../../constants/colors";
import { scale } from "../../utils/responsive";

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
        // 테두리 두 면을 회전시켜 체크 표시를 만든다
        <View
          style={[
            styles.checkMark,
            { width: diameter * 0.38, height: diameter * 0.22 },
          ]}
        />
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
  checkMark: {
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderColor: COLORS.background,
    transform: [{ rotate: "-45deg" }],
    marginTop: -2,
  },
});
