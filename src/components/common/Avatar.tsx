// src/components/common/Avatar.tsx
// 참여자 기본 아바타 (개발 가이드 2장)
// - 닉네임 첫 1자를 표시, 프로필 이미지는 사용하지 않음
// - 배경색: (첫 글자의 유니코드 값) % 6 → 프로필 팔레트
// - 글자: #111111 Bold, 원 지름의 약 35%

import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { COLORS, PROFILE_PALETTE } from "../../constants/colors";
import { scale } from "../../utils/responsive";

interface AvatarProps {
  nickname: string;
  size?: number;
}

export const getProfileColor = (nickname: string): string => {
  const code = nickname.trim().codePointAt(0) ?? 0;
  return PROFILE_PALETTE[code % PROFILE_PALETTE.length];
};

export default function Avatar({ nickname, size = 36 }: AvatarProps) {
  const diameter = scale(size);
  const firstChar = Array.from(nickname.trim())[0] ?? "";

  return (
    <View
      style={[
        styles.circle,
        {
          width: diameter,
          height: diameter,
          borderRadius: diameter / 2,
          backgroundColor: getProfileColor(nickname),
        },
      ]}
    >
      <Text style={[styles.text, { fontSize: diameter * 0.35 }]}>
        {firstChar}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: { justifyContent: "center", alignItems: "center" },
  text: { color: COLORS.textMain, fontWeight: "bold" },
});
