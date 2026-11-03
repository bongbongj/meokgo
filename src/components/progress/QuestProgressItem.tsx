// src/components/progress/QuestProgressItem.tsx
// 10-2 퀘스트 카드 (디자인: 353 x 88, radius 16)
// - 완료: 연한 코랄 배경 + 코랄 체크 원 / 미완료: 회색 배경 + 빈 원
// - 체크 원을 누르면 완료 ↔ 완료 취소

import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { COLORS } from "../../constants/colors";
import { moderateScale, scale, verticalScale } from "../../utils/responsive";
import CheckCircle from "../common/CheckCircle";

interface QuestProgressItemProps {
  title: string;
  completed: boolean;
  disabled?: boolean;
  onToggle: () => void;
}

export default function QuestProgressItem({
  title,
  completed,
  disabled = false,
  onToggle,
}: QuestProgressItemProps) {
  return (
    <View style={[styles.card, completed ? styles.cardDone : styles.cardTodo]}>
      <TouchableOpacity
        onPress={onToggle}
        disabled={disabled}
        hitSlop={12}
        activeOpacity={0.7}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: completed, disabled }}
        accessibilityLabel={title}
      >
        <CheckCircle checked={completed} />
      </TouchableOpacity>
      <View style={styles.texts}>
        <Text style={styles.title}>{title}</Text>
        <Text style={[styles.status, completed ? styles.statusDone : styles.statusTodo]}>
          {completed ? "완료" : "아직 완료하지 않았어요"}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: verticalScale(88),
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(14),
    borderRadius: scale(16),
    marginBottom: verticalScale(12),
  },
  cardDone: { backgroundColor: COLORS.coralTint },
  cardTodo: { backgroundColor: COLORS.cardBg },
  texts: { flex: 1, marginLeft: scale(14) },
  title: {
    fontSize: moderateScale(15),
    fontWeight: "600",
    color: COLORS.textMain,
    marginBottom: verticalScale(5),
  },
  status: { fontSize: moderateScale(12) },
  statusDone: { color: COLORS.primary },
  statusTodo: { color: COLORS.textMuted },
});
