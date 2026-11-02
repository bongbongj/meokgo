// src/components/confirm/TieBreakSelector.tsx
// 동점 후보 선택 (방장) — 디자인 시안 없음, 07 퀘스트 투표 목록과 같은 모양
// 그룹마다 required_select_count개까지만 선택할 수 있다

import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { COLORS } from "../../constants/colors";
import { moderateScale, scale, verticalScale } from "../../utils/responsive";
import type { TieGroup } from "../../api/finalQuestApi";
import CheckCircle from "../common/CheckCircle";

interface TieBreakSelectorProps {
  group: TieGroup;
  selectedIds: number[];
  onToggle: (candidateId: number) => void;
}

export default function TieBreakSelector({
  group,
  selectedIds,
  onToggle,
}: TieBreakSelectorProps) {
  return (
    <View style={styles.group}>
      <Text style={styles.counter}>
        {selectedIds.length}/{group.required_select_count} 선택
      </Text>
      {group.candidates.map((candidate) => {
        const checked = selectedIds.includes(candidate.candidate_id);
        return (
          <TouchableOpacity
            key={candidate.candidate_id}
            style={[styles.item, checked && styles.itemChecked]}
            onPress={() => onToggle(candidate.candidate_id)}
            activeOpacity={0.7}
            accessibilityRole="checkbox"
            accessibilityState={{ checked }}
          >
            <View style={styles.texts}>
              <Text
                style={[styles.title, checked && styles.titleChecked]}
                numberOfLines={2}
              >
                {candidate.quest_title}
              </Text>
              <Text style={styles.votes}>득표 {candidate.vote_count}표</Text>
            </View>
            <CheckCircle checked={checked} />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { marginBottom: verticalScale(12) },
  counter: {
    alignSelf: "flex-end",
    marginBottom: verticalScale(8),
    fontSize: moderateScale(13),
    fontWeight: "bold",
    color: COLORS.primary,
  },
  item: {
    minHeight: verticalScale(66),
    marginBottom: verticalScale(6),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(8),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  itemChecked: {
    backgroundColor: COLORS.coralTint,
    borderRadius: scale(12),
    borderBottomColor: "transparent",
  },
  texts: { flex: 1, marginRight: scale(12) },
  title: { fontSize: moderateScale(15), color: COLORS.textMain },
  titleChecked: { fontWeight: "bold" },
  votes: {
    marginTop: verticalScale(2),
    fontSize: moderateScale(12),
    color: COLORS.textSub,
  },
});
