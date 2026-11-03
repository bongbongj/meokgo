// src/screens/VoteStatusScreen.tsx
// 09-1. 투표 현황 (방장) / 10. 투표 대기 (참가자)
// - 방장 여부에 따라 화면을 나눈다 (같은 주소: /rooms/:roomId/vote-status)
// - 참여자별 투표 상태를 화면 진입 시 1회 + 5초 간격으로 갱신
// - 방장: 퀘스트별 득표 확인, 투표 마감하기 → 09-2 마감 확인창 → 퀘스트 확정 화면
// - 참가자: 투표 수정하기 → 09 퀘스트 투표, 방장이 마감하면 퀘스트 확정 화면으로 자동 전환

import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { COLORS } from "../constants/colors";
import { moderateScale, scale, verticalScale } from "../utils/responsive";
import { isApiError } from "../api/client";
import {
  closeVote,
  fetchRoomState,
  fetchVoteClosePreview,
  fetchVoteStatus,
  VoteClosePreview,
  VoteStatus,
} from "../api/voteApi";
import type { RoomStatus } from "../api/types";
import usePolling from "../hooks/usePolling";
import { NavHeader } from "../components/ScreenHeader";
import PrimaryButton from "../components/common/PrimaryButton";
import ConfirmDialog from "../components/common/ConfirmDialog";
import ParticipantVoteList from "../components/vote/ParticipantVoteList";
import QuestVoteBars from "../components/vote/QuestVoteBars";

interface VoteStatusScreenProps {
  roomId: number;
}

// 투표가 끝난 방 상태 → 이동할 화면
const NEXT_ROUTE: Partial<Record<RoomStatus, "confirm" | "progress">> = {
  VOTE_CLOSED: "confirm",
  QUEST_CONFIRMED: "confirm",
  IN_PROGRESS: "progress",
};

const getCloseErrorMessage = (error: unknown): string => {
  if (!isApiError(error)) return "잠시 후 다시 시도해주세요.";
  switch (error.code) {
    case "ROOM-004":
      return "방장만 투표를 마감할 수 있어요.";
    default:
      return error.message;
  }
};

export default function VoteStatusScreen({ roomId }: VoteStatusScreenProps) {
  const [status, setStatus] = useState<VoteStatus | null>(null);
  const [isHost, setIsHost] = useState<boolean | null>(null);

  // 09-2 투표 마감 확인창
  // 닫힐 때 페이드아웃 동안 문구가 바뀌지 않도록 표시 여부와 내용을 따로 둔다
  const [dialogVisible, setDialogVisible] = useState(false);
  const [preview, setPreview] = useState<VoteClosePreview | null>(null);
  const [opening, setOpening] = useState(false);
  const [closing, setClosing] = useState(false);
  const [closeError, setCloseError] = useState<string | null>(null);

  const goNext = useCallback(
    (next: "confirm" | "progress") => router.replace(`/rooms/${roomId}/${next}`),
    [roomId],
  );

  const refresh = useCallback(async () => {
    try {
      const [voteStatus, roomState] = await Promise.all([
        fetchVoteStatus(roomId),
        fetchRoomState(roomId),
      ]);
      const next = NEXT_ROUTE[roomState.room_status];
      if (next) {
        goNext(next);
        return;
      }
      setStatus(voteStatus);
      setIsHost(roomState.is_host);
    } catch {
      // 일시적인 오류는 다음 폴링에서 다시 시도한다
    }
  }, [roomId, goNext]);

  usePolling(refresh);

  const openCloseDialog = async () => {
    setOpening(true);
    setCloseError(null);
    try {
      setPreview(await fetchVoteClosePreview(roomId));
      setDialogVisible(true);
    } catch (error) {
      setCloseError(getCloseErrorMessage(error));
    } finally {
      setOpening(false);
    }
  };

  const handleClose = async () => {
    setClosing(true);
    try {
      await closeVote(roomId);
      setDialogVisible(false);
      goNext("confirm");
    } catch (error) {
      setDialogVisible(false);
      if (isApiError(error) && error.code === "VOTE-001") {
        goNext("confirm"); // 이미 마감된 투표
        return;
      }
      setCloseError(getCloseErrorMessage(error));
    } finally {
      setClosing(false);
    }
  };

  const totalVotes =
    status?.candidate_results.reduce((sum, c) => sum + c.vote_count, 0) ?? 0;

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.mobileWrapper}>
        <NavHeader
          title={isHost === null ? "" : isHost ? "투표 현황" : "투표 대기"}
          onBack={() => router.replace("/home")}
        />

        {isHost === null ? (
          <View style={styles.center}>
            <ActivityIndicator color={COLORS.primary} />
          </View>
        ) : isHost ? (
          // 09-1. 투표 현황 (방장)
          <>
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.intro}>
                <Text style={styles.introTitle}>친구들이 투표하고 있어요</Text>
                <Text style={styles.introSub}>
                  모두 마치지 않아도 방장이 투표를 마감할 수 있어요
                </Text>
              </View>

              <View style={styles.section}>
                <ParticipantVoteList
                  title="참여자 투표 상태"
                  status={status}
                  avatarSize={34}
                />
              </View>

              {status && (
                <View style={[styles.section, styles.barsSection]}>
                  <QuestVoteBars status={status} />
                </View>
              )}
            </ScrollView>

            <View style={styles.footer}>
              {closeError && <Text style={styles.error}>{closeError}</Text>}
              <PrimaryButton
                label="투표 마감하기"
                onPress={openCloseDialog}
                disabled={totalVotes === 0} // 득표 합계가 0이면 마감 불가
                loading={opening}
              />
              <Text style={styles.caption}>
                마감하면 득표순 상위 3개가 최종 퀘스트로 확정돼요
              </Text>
            </View>

            {/* 09-2. 투표 마감 확인 */}
            <ConfirmDialog
              visible={dialogVisible}
              title="투표를 마감할까요?"
              message={
                (preview && preview.not_voted_participant_count > 0
                  ? `아직 투표하지 않은 친구가 ${preview.not_voted_participant_count}명 있어요`
                  : "모두 투표를 마쳤어요") +
                "\n마감하면 지금까지의 득표로 퀘스트가 확정돼요"
              }
              confirmLabel="마감하기"
              onCancel={() => setDialogVisible(false)}
              onConfirm={handleClose}
              loading={closing}
            >
              {preview && preview.top_candidates.length > 0 && (
                <View style={styles.topBox}>
                  <Text style={styles.topLabel}>현재 득표 1위</Text>
                  <Text style={styles.topValue} numberOfLines={1}>
                    {preview.top_candidates[0].quest_title} ·{" "}
                    {preview.top_candidates[0].vote_count}표
                  </Text>
                </View>
              )}
            </ConfirmDialog>
          </>
        ) : (
          // 10. 투표 대기 (참가자)
          <>
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
                <Text style={styles.doneSub}>
                  친구들의 투표를 기다리고 있어요.
                </Text>
              </View>

              <View style={styles.section}>
                <ParticipantVoteList title="투표 현황" status={status} />
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
          </>
        )}
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
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  scrollContent: { paddingBottom: verticalScale(24) },
  section: { paddingHorizontal: scale(20) },

  // 09-1
  intro: {
    paddingHorizontal: scale(20),
    paddingTop: verticalScale(8),
    paddingBottom: verticalScale(20),
  },
  introTitle: {
    fontSize: moderateScale(20),
    fontWeight: "bold",
    color: COLORS.textMain,
    marginBottom: verticalScale(6),
  },
  introSub: { fontSize: moderateScale(13), color: COLORS.textSub },
  barsSection: { marginTop: verticalScale(16) },
  topBox: {
    marginTop: verticalScale(24),
    backgroundColor: COLORS.cardBg,
    borderRadius: scale(12),
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(10),
  },
  topLabel: {
    fontSize: moderateScale(12),
    color: COLORS.textMuted,
    marginBottom: verticalScale(2),
  },
  topValue: {
    fontSize: moderateScale(13),
    fontWeight: "bold",
    color: COLORS.textMain,
  },
  error: {
    marginBottom: verticalScale(8),
    fontSize: moderateScale(12),
    color: COLORS.primary,
    textAlign: "center",
  },

  // 10
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
