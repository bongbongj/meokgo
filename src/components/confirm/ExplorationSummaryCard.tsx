// src/components/confirm/ExplorationSummaryCard.tsx
// 탐험 요약 카드 — 지역명 / 대표 참여자 외 N명 / 날짜 (디자인: 353 x 76, radius 16)

import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { COLORS } from "../../constants/colors";
import { moderateScale, scale, verticalScale } from "../../utils/responsive";

interface ExplorationSummaryCardProps {
  regionName: string;
  hostNickname: string;
  participantCount: number;
  dateText: string;
}

export default function ExplorationSummaryCard({
  regionName,
  hostNickname,
  participantCount,
  dateText,
}: ExplorationSummaryCardProps) {
  const others = participantCount - 1;
  const people = others > 0 ? `${hostNickname} 외 ${others}명` : hostNickname;

  return (
    <View style={styles.card}>
      <View style={styles.iconCircle}>
        <Image
          source={require("../../../assets/images/icon-pin.png")}
          style={styles.icon}
          resizeMode="contain"
        />
      </View>
      <View style={styles.texts}>
        <Text style={styles.region}>{regionName} 탐험</Text>
        <Text style={styles.meta}>
          {people} · {dateText}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: verticalScale(76),
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(12),
    borderRadius: scale(16),
    backgroundColor: COLORS.cardBg,
  },
  iconCircle: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(18),
    backgroundColor: COLORS.coralTint,
    justifyContent: "center",
    alignItems: "center",
    marginRight: scale(12),
  },
  icon: { width: scale(18), height: scale(18) },
  texts: { flex: 1 },
  region: {
    fontSize: moderateScale(15),
    fontWeight: "bold",
    color: COLORS.textMain,
    marginBottom: verticalScale(3),
  },
  meta: { fontSize: moderateScale(12), color: COLORS.textSub },
});
