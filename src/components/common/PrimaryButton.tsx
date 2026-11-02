// src/components/common/PrimaryButton.tsx
// 기본 CTA 버튼 (개발 가이드 5장: 353 x 52, radius 14)
// - filled: 코랄 배경 / 비활성 시 #F2F2F2 배경, #A5A5A5 글자
// - outline: 흰 배경 + 코랄 테두리 (예: 투표 수정하기)

import React from "react";
import {
  ActivityIndicator,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  ViewStyle,
} from "react-native";
import { COLORS } from "../../constants/colors";
import { moderateScale, verticalScale, scale } from "../../utils/responsive";

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  variant?: "filled" | "outline";
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}

export default function PrimaryButton({
  label,
  onPress,
  variant = "filled",
  disabled = false,
  loading = false,
  style,
}: PrimaryButtonProps) {
  const isOutline = variant === "outline";
  const inactive = disabled || loading;

  return (
    <TouchableOpacity
      style={[
        styles.button,
        isOutline ? styles.outline : styles.filled,
        disabled && (isOutline ? styles.outlineDisabled : styles.filledDisabled),
        style,
      ]}
      onPress={onPress}
      disabled={inactive}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive }}
    >
      {loading ? (
        <ActivityIndicator
          color={isOutline ? COLORS.primary : COLORS.background}
        />
      ) : (
        <Text
          style={[
            styles.label,
            isOutline ? styles.outlineLabel : styles.filledLabel,
            disabled && styles.disabledLabel,
          ]}
        >
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: "100%",
    height: verticalScale(52),
    borderRadius: scale(14),
    justifyContent: "center",
    alignItems: "center",
  },
  filled: { backgroundColor: COLORS.primary },
  filledDisabled: { backgroundColor: COLORS.disabledBg },
  outline: {
    backgroundColor: COLORS.background,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  outlineDisabled: { borderColor: COLORS.border },
  label: { fontSize: moderateScale(16), fontWeight: "bold" },
  filledLabel: { color: COLORS.background },
  outlineLabel: { color: COLORS.primary },
  disabledLabel: { color: COLORS.disabledText },
});
