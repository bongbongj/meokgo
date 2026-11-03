// src/components/ProfileAvatar.tsx

import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { COLORS, PROFILE_PALETTE } from "../constants/colors";

// 색상 결정식: (닉네임 첫 글자의 유니코드 값) % 6
export const getProfileColor = (nickname: string) =>
  PROFILE_PALETTE[(nickname.codePointAt(0) ?? 0) % PROFILE_PALETTE.length];

/**
 * 프로필 이미지 없이 닉네임 첫 글자 + 팔레트 색상 원
 */
export default function ProfileAvatar({
  nickname,
  size,
}: {
  nickname: string;
  size: number;
}) {
  return (
    <View
      style={[
        styles.circle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: getProfileColor(nickname),
        },
      ]}
    >
      {/* 글자 크기는 원 지름의 약 35% */}
      <Text style={[styles.initial, { fontSize: size * 0.35 }]}>
        {Array.from(nickname)[0]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: { justifyContent: "center", alignItems: "center" },
  initial: { color: COLORS.textMain, fontWeight: "bold" },
});
