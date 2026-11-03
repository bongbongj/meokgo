// src/components/confirm/FinalQuestCard.tsx
// 확정된 퀘스트 카드 — 순번 / 퀘스트 내용 / 득표수 (디자인: 353 x 88, radius 16)

import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { COLORS } from "../../constants/colors";
import { moderateScale, scale, verticalScale } from "../../utils/responsive";

interface FinalQuestCardProps {
  rank: number;
  title: string;
  voteCount: number;
}

export default function FinalQuestCard({
  rank,
  title,
  voteCount,
}: FinalQuestCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.rankCircle}>
        <Text style={styles.rank}>{rank}</Text>
      </View>
      <View style={styles.texts}>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
        <Text style={styles.votes}>득표 {voteCount}표</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    minHeight: verticalScale(88),
    marginBottom: verticalScale(12),
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(18),
    borderRadius: scale(16),
    backgroundColor: COLORS.cardBg,
  },
  rankCircle: {
    width: scale(28),
    height: scale(28),
    borderRadius: scale(14),
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: scale(12),
  },
  rank: {
    fontSize: moderateScale(14),
    fontWeight: "bold",
    color: COLORS.background,
  },
  texts: { flex: 1, paddingTop: verticalScale(3) },
  title: {
    fontSize: moderateScale(15),
    fontWeight: "bold",
    color: COLORS.textMain,
    marginBottom: verticalScale(6),
  },
  votes: { fontSize: moderateScale(12), color: COLORS.textSub },
});
