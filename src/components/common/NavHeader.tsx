// src/components/common/NavHeader.tsx
// 상단 네비게이션 헤더: 뒤로가기 + 중앙 타이틀 (개발 가이드 3장: Bold 17)
// onBack을 넘기지 않으면 router.back()으로 이동한다.

import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";
import { COLORS } from "../../constants/colors";
import { moderateScale, scale, verticalScale } from "../../utils/responsive";

interface NavHeaderProps {
  title: string;
  onBack?: () => void;
  showBack?: boolean;
}

export default function NavHeader({
  title,
  onBack,
  showBack = true,
}: NavHeaderProps) {
  const handleBack = () => {
    if (onBack) onBack();
    else if (router.canGoBack()) router.back();
  };

  return (
    <View style={styles.container}>
      {showBack && (
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="뒤로가기"
        >
          <View style={styles.chevron} />
        </TouchableOpacity>
      )}
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: verticalScale(56),
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: scale(20),
  },
  backButton: {
    position: "absolute",
    left: scale(12),
    width: scale(44),
    height: scale(44),
    justifyContent: "center",
    alignItems: "center",
  },
  // 이미지 없이 테두리 두 면을 회전시켜 '<' 모양을 만든다
  chevron: {
    width: scale(11),
    height: scale(11),
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderColor: COLORS.textMain,
    transform: [{ rotate: "45deg" }],
    marginLeft: scale(4),
  },
  title: {
    fontSize: moderateScale(17),
    fontWeight: "bold",
    color: COLORS.textMain,
  },
});
