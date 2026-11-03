// src/components/vote/ParticipantVoteList.tsx
// 참여자별 투표 상태 목록 (09-1 투표 현황 / 10 투표 대기)

import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { COLORS } from "../../constants/colors";
import { moderateScale, scale, verticalScale } from "../../utils/responsive";
import type { VoteStatus } from "../../api/voteApi";
import ProfileAvatar from "../ProfileAvatar";

interface ParticipantVoteListProps {
  title: string;
  status: VoteStatus | null;
  avatarSize?: number; // 09-1: 34, 10: 36
}

export default function ParticipantVoteList({
  title,
  status,
  avatarSize = 36,
}: ParticipantVoteListProps) {
  return (
    <View>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {status && (
          <Text style={styles.count}>
            {status.voted_participant_count} / {status.total_participant_count}{" "}
            완료
          </Text>
        )}
      </View>

      {status?.participants.map((participant) => (
        <View key={participant.participant_id} style={styles.row}>
          <ProfileAvatar nickname={participant.nickname} size={scale(avatarSize)} />
          <Text style={styles.nickname}>{participant.nickname}</Text>
          <Text
            style={[
              styles.voteState,
              participant.voted ? styles.voted : styles.voting,
            ]}
          >
            {participant.voted ? "완료" : "투표 중"}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: verticalScale(12),
  },
  title: {
    fontSize: moderateScale(16),
    fontWeight: "bold",
    color: COLORS.textMain,
  },
  count: {
    fontSize: moderateScale(13),
    fontWeight: "bold",
    color: COLORS.primary,
  },
  // 디자인: 구분선은 각 행 위쪽에만 (마지막 행 아래 선 없음)
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: verticalScale(11),
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  nickname: {
    flex: 1,
    marginLeft: scale(12),
    fontSize: moderateScale(15),
    color: COLORS.textMain,
  },
  voteState: { fontSize: moderateScale(13), fontWeight: "bold" },
  voted: { color: COLORS.primary },
  voting: { color: COLORS.textMuted },
});
