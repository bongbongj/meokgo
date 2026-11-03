// src/screens/QuestConfirmScreen.tsx
// 10-1. 퀘스트 확정
// - 방장: 화면 진입 시 미리보기 조회 → 동점 없으면 자동 확정, 동점 있으면 동점 후보 직접 선택 후 확정
// - 방장: 탐험 시작하기 → 10-2 퀘스트 진행
// - 참가자: 방장이 확정할 때까지 대기 → 확정된 퀘스트 표시 → 방장이 탐험을 시작하면 자동 이동
// - 방 상태를 화면 진입 시 1회 + 5초 간격으로 확인

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { COLORS } from "../constants/colors";
import { moderateScale, scale, verticalScale } from "../utils/responsive";
import { formatDotDate } from "../utils/date";
import { isApiError } from "../api/client";
import { fetchRoomDetail, fetchRoomState, RoomDetail } from "../api/voteApi";
import {
  confirmFinalQuests,
  fetchFinalQuestPreview,
  fetchFinalQuests,
  FinalQuest,
  submitTieBreak,
  TieGroup,
} from "../api/finalQuestApi";
import { startExploration } from "../api/explorationApi";
import usePolling from "../hooks/usePolling";
import { NavHeader } from "../components/ScreenHeader";
import PrimaryButton from "../components/common/PrimaryButton";
import ExplorationSummaryCard from "../components/confirm/ExplorationSummaryCard";
import FinalQuestCard from "../components/confirm/FinalQuestCard";
import TieBreakSelector from "../components/confirm/TieBreakSelector";

interface QuestConfirmScreenProps {
  roomId: number;
}

const getErrorMessage = (error: unknown): string => {
  if (!isApiError(error)) return "잠시 후 다시 시도해주세요.";
  switch (error.code) {
    case "ROOM-004":
      return "방장만 진행할 수 있어요.";
    case "FINAL-001":
      return "동점인 퀘스트를 먼저 골라주세요.";
    default:
      return error.message;
  }
};

export default function QuestConfirmScreen({ roomId }: QuestConfirmScreenProps) {
  const [isHost, setIsHost] = useState<boolean | null>(null);
  const [detail, setDetail] = useState<RoomDetail | null>(null);
  const [finalQuests, setFinalQuests] = useState<FinalQuest[] | null>(null);
  const [tieGroups, setTieGroups] = useState<TieGroup[] | null>(null);
  const [tieSelection, setTieSelection] = useState<Record<number, number[]>>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [starting, setStarting] = useState(false);

  // 방장 확정 흐름은 한 번만 실행 (폴링마다 반복하지 않도록)
  const hostFlowStarted = useRef(false);
  const loadingQuests = useRef(false);

  // 탐험 요약 카드
  useEffect(() => {
    let cancelled = false;
    fetchRoomDetail(roomId).then(
      (result) => {
        if (!cancelled) setDetail(result);
      },
      () => {},
    );
    return () => {
      cancelled = true;
    };
  }, [roomId]);

  const runHostFlow = useCallback(
    async (alreadyConfirmed: boolean) => {
      try {
        if (alreadyConfirmed) {
          setFinalQuests(await fetchFinalQuests(roomId));
          return;
        }
        const preview = await fetchFinalQuestPreview(roomId);
        if (preview.tie_break_required && preview.tie_groups?.length) {
          setTieGroups(preview.tie_groups);
          return;
        }
        const result = await confirmFinalQuests(roomId);
        setFinalQuests(result.final_quests);
      } catch (e) {
        hostFlowStarted.current = false; // 다시 시도 가능하도록
        setError(getErrorMessage(e));
      }
    },
    [roomId],
  );

  const refresh = useCallback(async () => {
    try {
      const state = await fetchRoomState(roomId);
      setIsHost(state.is_host);

      if (state.room_status === "IN_PROGRESS") {
        router.replace(`/rooms/${roomId}/progress`);
        return;
      }

      const confirmed = state.room_status === "QUEST_CONFIRMED";
      if (state.is_host) {
        if (!hostFlowStarted.current && !error) {
          hostFlowStarted.current = true;
          runHostFlow(confirmed);
        }
      } else if (confirmed && !finalQuests && !loadingQuests.current) {
        loadingQuests.current = true;
        try {
          setFinalQuests(await fetchFinalQuests(roomId));
        } finally {
          loadingQuests.current = false;
        }
      }
    } catch {
      // 일시적인 오류는 다음 폴링에서 다시 시도한다
    }
  }, [roomId, error, finalQuests, runHostFlow]);

  usePolling(refresh);

  const retry = () => {
    setError(null);
    hostFlowStarted.current = false;
  };

  const toggleTie = (group: TieGroup, candidateId: number) => {
    setTieSelection((prev) => {
      const current = prev[group.tie_group_no] ?? [];
      if (current.includes(candidateId)) {
        return {
          ...prev,
          [group.tie_group_no]: current.filter((id) => id !== candidateId),
        };
      }
      if (current.length >= group.required_select_count) return prev;
      return { ...prev, [group.tie_group_no]: [...current, candidateId] };
    });
  };

  const tieComplete =
    tieGroups?.every(
      (group) =>
        (tieSelection[group.tie_group_no]?.length ?? 0) ===
        group.required_select_count,
    ) ?? false;

  const handleTieBreak = async () => {
    if (!tieGroups || !tieComplete || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await submitTieBreak(roomId, tieGroups.flatMap((g) => tieSelection[g.tie_group_no] ?? []));
      const result = await confirmFinalQuests(roomId);
      setTieGroups(null);
      setFinalQuests(result.final_quests);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  const handleStart = async () => {
    if (starting) return;
    setStarting(true);
    setError(null);
    try {
      await startExploration(roomId);
      router.replace(`/rooms/${roomId}/progress`);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setStarting(false);
    }
  };

  const requiredTieCount =
    tieGroups?.reduce((sum, g) => sum + g.required_select_count, 0) ?? 0;
  const host = detail?.participants.find((p) => p.role === "HOST");

  // 화면 상태별 안내 문구
  const intro = finalQuests
    ? { title: "오늘의 퀘스트가 정해졌어요", sub: "친구들의 투표로 3개가 확정됐어요" }
    : isHost && tieGroups
      ? { title: "동점인 퀘스트가 있어요", sub: `동점 후보 중 ${requiredTieCount}개를 골라주세요` }
      : isHost === false
        ? { title: "퀘스트를 확정하고 있어요", sub: "방장이 확정하면 바로 보여드릴게요" }
        : null;

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.mobileWrapper}>
        <NavHeader title="퀘스트 확정" onBack={() => router.replace("/home")} />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {intro && (
            <View style={styles.intro}>
              <Text style={styles.introTitle}>{intro.title}</Text>
              <Text style={styles.introSub}>{intro.sub}</Text>
            </View>
          )}

          {detail && intro && (
            <View style={styles.section}>
              <ExplorationSummaryCard
                regionName={detail.region_name}
                hostNickname={host?.nickname ?? detail.participants[0]?.nickname ?? ""}
                participantCount={detail.participants.length}
                dateText={formatDotDate()}
              />
            </View>
          )}

          <View style={[styles.section, styles.listSection]}>
            {finalQuests ? (
              <>
                <Text style={styles.sectionTitle}>확정된 퀘스트</Text>
                {finalQuests.map((quest) => (
                  <FinalQuestCard
                    key={quest.final_quest_id}
                    rank={quest.rank_no}
                    title={quest.quest_title}
                    voteCount={quest.vote_count}
                  />
                ))}
              </>
            ) : isHost && tieGroups ? (
              <>
                <Text style={styles.sectionTitle}>동점 후보</Text>
                {tieGroups.map((group) => (
                  <TieBreakSelector
                    key={group.tie_group_no}
                    group={group}
                    selectedIds={tieSelection[group.tie_group_no] ?? []}
                    onToggle={(id) => toggleTie(group, id)}
                  />
                ))}
              </>
            ) : error ? (
              <View style={styles.center}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity onPress={retry} style={styles.retry}>
                  <Text style={styles.retryText}>다시 시도</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.center}>
                <ActivityIndicator color={COLORS.primary} />
              </View>
            )}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          {error && (finalQuests || tieGroups) && (
            <Text style={styles.inlineError}>{error}</Text>
          )}
          {finalQuests && isHost && (
            <PrimaryButton
              label="탐험 시작하기"
              onPress={handleStart}
              loading={starting}
            />
          )}
          {!finalQuests && isHost && tieGroups && (
            <PrimaryButton
              label="이 퀘스트로 확정하기"
              onPress={handleTieBreak}
              disabled={!tieComplete}
              loading={submitting}
            />
          )}
          {finalQuests && (
            <Text style={styles.caption}>
              {isHost
                ? "퀘스트는 탐험 중에 순서 없이 진행할 수 있어요"
                : "방장이 탐험을 시작하면 자동으로 넘어가요"}
            </Text>
          )}
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
  scrollContent: { flexGrow: 1, paddingBottom: verticalScale(24) },
  section: { paddingHorizontal: scale(20) },
  center: {
    paddingTop: verticalScale(80),
    alignItems: "center",
  },

  intro: {
    paddingHorizontal: scale(20),
    paddingTop: verticalScale(8),
    paddingBottom: verticalScale(10),
  },
  introTitle: {
    fontSize: moderateScale(20),
    fontWeight: "bold",
    color: COLORS.textMain,
    marginBottom: verticalScale(6),
  },
  introSub: { fontSize: moderateScale(13), color: COLORS.textSub },

  listSection: { marginTop: verticalScale(32) },
  sectionTitle: {
    fontSize: moderateScale(16),
    fontWeight: "bold",
    color: COLORS.textMain,
    marginBottom: verticalScale(6),
  },

  errorText: {
    fontSize: moderateScale(14),
    color: COLORS.textSub,
    textAlign: "center",
  },
  retry: {
    marginTop: verticalScale(12),
    paddingVertical: verticalScale(8),
    paddingHorizontal: scale(16),
  },
  retryText: {
    fontSize: moderateScale(14),
    fontWeight: "bold",
    color: COLORS.primary,
  },

  footer: {
    paddingHorizontal: scale(20),
    paddingTop: verticalScale(12),
    paddingBottom: verticalScale(16),
  },
  inlineError: {
    marginBottom: verticalScale(8),
    fontSize: moderateScale(12),
    color: COLORS.primary,
    textAlign: "center",
  },
  caption: {
    marginTop: verticalScale(10),
    fontSize: moderateScale(12),
    color: COLORS.textMuted,
    textAlign: "center",
  },
});
