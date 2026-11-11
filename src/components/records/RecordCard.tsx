// src/components/records/RecordCard.tsx
// 11 내 기록 — 탐험 기록 카드 (2열, 대표 사진 + 지역 칩 + 지역 탐험 + 날짜 · 퀘스트 수)

import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { COLORS } from "../../constants/colors";
import { moderateScale, scale, verticalScale } from "../../utils/responsive";
import { formatDotDate } from "../../utils/date";
import { RecordSummary } from "../../api/recordApi";
import PhotoImage from "../common/PhotoImage";

interface RecordCardProps {
  record: RecordSummary;
  onPress: () => void;
}

export default function RecordCard({ record, onPress }: RecordCardProps) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={`${record.region_name} 탐험 기록`}
    >
      {record.thumbnail_url ? (
        <PhotoImage url={record.thumbnail_url} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.imageEmpty]} />
      )}
      <View style={styles.chip}>
        <Text style={styles.chipText}>{record.region_name}</Text>
      </View>
      <Text style={styles.title} numberOfLines={1}>
        {record.region_name} 탐험
      </Text>
      <Text style={styles.meta}>
        {formatDotDate(record.created_at)} · 퀘스트 {record.completed_quest_count}개
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1 },
  image: {
    width: "100%",
    height: verticalScale(100),
    borderRadius: scale(6),
    marginBottom: verticalScale(8),
  },
  imageEmpty: { backgroundColor: COLORS.cardBg },
  chip: {
    alignSelf: "flex-start",
    height: verticalScale(24),
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.chipBorder,
    paddingHorizontal: scale(10),
    borderRadius: 999,
    marginLeft: scale(4),
    marginBottom: verticalScale(6),
  },
  chipText: { fontSize: moderateScale(12), color: COLORS.primary },
  title: {
    fontSize: moderateScale(15),
    fontWeight: "600",
    color: COLORS.textMain,
    marginLeft: scale(4),
    marginBottom: verticalScale(2),
  },
  meta: {
    fontSize: moderateScale(11),
    color: COLORS.textSub,
    marginLeft: scale(4),
  },
});
