// src/components/vote/QuestVoteBars.tsx
// 퀘스트별 득표 막대 그래프 (09-1 투표 현황)
// - 득표가 있는 퀘스트만 득표순으로 표시
// - 막대 길이 = 득표수 / 전체 참여 인원

import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { COLORS } from "../../constants/colors";
import { moderateScale, verticalScale } from "../../utils/responsive";
import type { VoteStatus } from "../../api/voteApi";

interface QuestVoteBarsProps {
  status: VoteStatus;
}

export default function QuestVoteBars({ status }: QuestVoteBarsProps) {
  const results = status.candidate_results
    .filter((result) => result.vote_count > 0)
    .sort((a, b) => b.vote_count - a.vote_count);
  const total = Math.max(status.total_participant_count, 1);

  return (
    <View>
      <Text style={styles.title}>퀘스트별 득표</Text>

      {results.length === 0 ? (
        <Text style={styles.empty}>아직 득표한 퀘스트가 없어요</Text>
      ) : (
        results.map((result) => (
          <View key={result.candidate_id} style={styles.item}>
            <View style={styles.labelRow}>
              <Text style={styles.questTitle} numberOfLines={1}>
                {result.quest_title}
              </Text>
              <Text style={styles.voteCount}>{result.vote_count}표</Text>
            </View>
            <View style={styles.track}>
              <View
                style={[
                  styles.fill,
                  { width: `${Math.min(result.vote_count / total, 1) * 100}%` },
                ]}
              />
            </View>
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: moderateScale(16),
    fontWeight: "bold",
    color: COLORS.textMain,
    marginBottom: verticalScale(10),
  },
  empty: { fontSize: moderateScale(13), color: COLORS.textMuted },
  // 디자인: 항목 간격 54, 막대 높이 6
  item: { marginBottom: verticalScale(24) },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: verticalScale(5),
  },
  questTitle: {
    flex: 1,
    marginRight: 8,
    fontSize: moderateScale(13),
    color: COLORS.textMain,
  },
  voteCount: {
    fontSize: moderateScale(12),
    fontWeight: "bold",
    color: COLORS.textSub,
  },
  track: {
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.trackBg,
    overflow: "hidden",
  },
  fill: { height: 6, borderRadius: 3, backgroundColor: COLORS.primary },
});
