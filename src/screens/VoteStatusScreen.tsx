// src/screens/VoteStatusScreen.tsx
// 09. 투표 대기 (참가자)
// - 투표 완료 안내, 참여자별 투표 상태를 5초 간격으로 갱신
// - 투표 수정하기 → 07 퀘스트 투표로 돌아가 다시 선택
// - 방장이 투표를 마감하면 퀘스트 확정 화면으로 자동 전환
// TODO: 08. 투표 현황(방장) 화면은 BE 투표 현황·마감 API 구현 후 이 파일에 추가

import React, { useCallback, useState } from "react";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { COLORS } from "../constants/colors";
import { moderateScale, scale, verticalScale } from "../utils/responsive";
import { fetchRoomStatus, fetchVoteStatus, VoteStatus } from "../api/voteApi";
import type { RoomStatus } from "../api/types";
import usePolling from "../hooks/usePolling";
import NavHeader from "../components/common/NavHeader";
import Avatar from "../components/common/Avatar";
import PrimaryButton from "../components/common/PrimaryButton";

interface VoteStatusScreenProps {
  roomId: number;
}

// 투표가 끝난 방 상태 → 이동할 화면
const NEXT_ROUTE: Partial<Record<RoomStatus, "confirm" | "progress">> = {
  VOTE_CLOSED: "confirm",
  QUEST_CONFIRMED: "confirm",
  IN_PROGRESS: "progress",
};

export default function VoteStatusScreen({ roomId }: VoteStatusScreenProps) {
  const [status, setStatus] = useState<VoteStatus | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [voteStatus, roomStatus] = await Promise.all([
        fetchVoteStatus(roomId),
        fetchRoomStatus(roomId),
      ]);
      const next = NEXT_ROUTE[roomStatus];
      if (next) {
        router.replace(`/rooms/${roomId}/${next}`);
        return;
      }
      setStatus(voteStatus);
    } catch {
      // 일시적인 오류는 다음 폴링에서 다시 시도한다
    }
  }, [roomId]);

  usePolling(refresh);

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.mobileWrapper}>
        <NavHeader title="투표 대기" onBack={() => router.replace("/home")} />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.doneCard}>
            <Image
              source={require("../../assets/images/vote-complete.png")}
              style={styles.illustration}
              resizeMode="contain"
            />
            <Text style={styles.doneTitle}>투표를 완료했어요!</Text>
            <Text style={styles.doneSub}>친구들의 투표를 기다리고 있어요.</Text>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>투표 현황</Text>
              {status && (
                <Text style={styles.sectionCount}>
                  {status.voted_participant_count} /{" "}
                  {status.total_participant_count} 완료
                </Text>
              )}
            </View>

            {status?.participants.map((participant) => (
              <View key={participant.participant_id} style={styles.row}>
                <Avatar nickname={participant.nickname} />
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
        </ScrollView>

        <View style={styles.footer}>
          <PrimaryButton
            label="투표 수정하기"
            variant="outline"
            onPress={() => router.replace(`/rooms/${roomId}/vote`)}
          />
          <Text style={styles.caption}>
            모두 투표를 마치면 퀘스트가 자동으로 확정돼요
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  mobileWrapper: {
    flex: 1,
    width: "100%",
    maxWidth: 393,
    alignSelf: "center",
  },
  scrollContent: { paddingBottom: verticalScale(24) },

  doneCard: {
    alignItems: "center",
    paddingTop: verticalScale(40),
    paddingBottom: verticalScale(68),
  },
  illustration: {
    width: scale(141),
    height: scale(141),
    marginBottom: verticalScale(10),
  },
  doneTitle: {
    fontSize: moderateScale(18),
    fontWeight: "bold",
    color: COLORS.textMain,
    marginBottom: verticalScale(6),
  },
  doneSub: { fontSize: moderateScale(13), color: COLORS.textSub },

  section: { paddingHorizontal: scale(20) },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: verticalScale(12),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  sectionTitle: {
    fontSize: moderateScale(16),
    fontWeight: "bold",
    color: COLORS.textMain,
  },
  sectionCount: {
    fontSize: moderateScale(13),
    fontWeight: "bold",
    color: COLORS.primary,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: verticalScale(12),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
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

  footer: {
    paddingHorizontal: scale(20),
    paddingTop: verticalScale(12),
    paddingBottom: verticalScale(16),
  },
  caption: {
    marginTop: verticalScale(10),
    fontSize: moderateScale(12),
    color: COLORS.textMuted,
    textAlign: "center",
  },
});
