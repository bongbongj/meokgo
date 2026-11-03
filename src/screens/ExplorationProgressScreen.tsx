// src/screens/ExplorationProgressScreen.tsx
// 10-2. 퀘스트 진행
// - 퀘스트 체크 원을 누르면 완료 / 완료 취소 (순서 무관, 결과는 참여자 전원에게 공유)
// - 완료 처리 시 진행률과 진행바를 즉시 갱신하고, 실패하면 되돌린다
// - 방장: 3개를 모두 완료하면 탐험 종료하기 활성 → 18 탐험 종료
// - 참가자: 방장이 종료하면(FINISHED 감지) 18 탐험 종료로 자동 이동
// - 화면 진입 시 1회 + 5초 간격으로 진행 상태와 방 상태를 확인

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
import { fetchRoomDetail, fetchRoomState } from "../api/voteApi";
import {
  ExplorationProgress,
  fetchExplorationProgress,
  finishExploration,
  updateQuestProgress,
} from "../api/explorationApi";
import usePolling from "../hooks/usePolling";
import { NavHeader } from "../components/ScreenHeader";
import PrimaryButton from "../components/common/PrimaryButton";
import ProgressSegments from "../components/progress/ProgressSegments";
import QuestProgressItem from "../components/progress/QuestProgressItem";

interface ExplorationProgressScreenProps {
  roomId: number;
}

const getErrorMessage = (error: unknown): string => {
  if (!isApiError(error)) return "잠시 후 다시 시도해주세요.";
  switch (error.code) {
    case "ROOM-004":
      return "방장만 탐험을 종료할 수 있어요.";
    case "ROOM-002":
      return "이미 종료된 탐험이에요.";
    default:
      return error.message;
  }
};

/** 퀘스트 하나의 완료 여부를 바꾸고 진행률을 다시 계산 */
const applyToggle = (
  progress: ExplorationProgress,
  finalQuestId: number,
  completed: boolean,
): ExplorationProgress => {
  const quests = progress.quests.map((q) =>
    q.final_quest_id === finalQuestId ? { ...q, completed } : q,
  );
  const done = quests.filter((q) => q.completed).length;
  return {
    ...progress,
    quests,
    completed_quest_count: done,
    progress_rate: progress.total_quest_count
      ? Math.round((done / progress.total_quest_count) * 100)
      : 0,
  };
};

export default function ExplorationProgressScreen({ roomId }: ExplorationProgressScreenProps) {
  const [isHost, setIsHost] = useState<boolean | null>(null);
  const [progress, setProgress] = useState<ExplorationProgress | null>(null);
  const [hostNickname, setHostNickname] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [finishing, setFinishing] = useState(false);

  // 완료 처리 요청 중에는 폴링 결과로 화면을 덮어쓰지 않는다
  const pendingToggles = useRef(0);
  const leaving = useRef(false);
  const loaded = useRef(false);

  const goFinish = useCallback(() => {
    if (leaving.current) return;
    leaving.current = true;
    router.replace(`/rooms/${roomId}/finish`);
  }, [roomId]);

  // 대표 참여자 닉네임 (진행 조회 응답에는 없음)
  useEffect(() => {
    let cancelled = false;
    fetchRoomDetail(roomId).then(
      (detail) => {
        if (cancelled) return;
        const host = detail.participants.find((p) => p.role === "HOST");
        setHostNickname(host?.nickname ?? detail.participants[0]?.nickname ?? "");
      },
      () => {},
    );
    return () => {
      cancelled = true;
    };
  }, [roomId]);

  const refresh = useCallback(async () => {
    try {
      const [state, result] = await Promise.all([
        fetchRoomState(roomId),
        fetchExplorationProgress(roomId),
      ]);
      setIsHost(state.is_host);
      if (state.room_status === "FINISHED") {
        goFinish();
        return;
      }
      if (pendingToggles.current === 0) setProgress(result);
      loaded.current = true;
      setLoadError(null);
    } catch (e) {
      // 첫 조회 실패만 화면에 표시하고, 이후 일시적인 오류는 다음 폴링에서 다시 시도한다
      if (!loaded.current) setLoadError(getErrorMessage(e));
    }
  }, [roomId, goFinish]);

  usePolling(refresh);

  const handleToggle = async (finalQuestId: number, completed: boolean) => {
    setError(null);
    setProgress((prev) => prev && applyToggle(prev, finalQuestId, completed));
    pendingToggles.current += 1;
    try {
      await updateQuestProgress(roomId, finalQuestId, completed);
    } catch (e) {
      setProgress((prev) => prev && applyToggle(prev, finalQuestId, !completed));
      setError(getErrorMessage(e));
    } finally {
      pendingToggles.current -= 1;
    }
  };

  const handleFinish = async () => {
    if (finishing) return;
    setFinishing(true);
    setError(null);
    try {
      await finishExploration(roomId);
      goFinish();
    } catch (e) {
      setError(getErrorMessage(e));
      setFinishing(false);
    }
  };

  const total = progress?.total_quest_count ?? 0;
  const done = progress?.completed_quest_count ?? 0;
  const allDone = total > 0 && done === total;
  const others = (progress?.participant_count ?? 0) - 1;
  const people = others > 0 ? `${hostNickname} 외 ${others}명` : hostNickname;

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.mobileWrapper}>
        <NavHeader title="탐험 진행 중" onBack={() => router.replace("/home")} />

        {progress ? (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.region}>{progress.region_name} 탐험</Text>
            <Text style={styles.meta}>
              {formatDotDate()}
              {people ? ` · ${people}` : ""}
            </Text>

            <View style={styles.progressHeader}>
              <Text style={styles.progressText}>
                퀘스트 {done} / {total} 완료
              </Text>
              <Text style={styles.progressRate}>{progress.progress_rate}%</Text>
            </View>
            <ProgressSegments total={total} completed={done} />

            <View style={styles.list}>
              {progress.quests.map((quest) => (
                <QuestProgressItem
                  key={quest.final_quest_id}
                  title={quest.quest_title}
                  completed={quest.completed}
                  disabled={finishing}
                  onToggle={() => handleToggle(quest.final_quest_id, !quest.completed)}
                />
              ))}
            </View>
          </ScrollView>
        ) : loadError ? (
          <View style={styles.center}>
            <Text style={styles.errorText}>{loadError}</Text>
            <TouchableOpacity onPress={refresh} style={styles.retry}>
              <Text style={styles.retryText}>다시 시도</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.center}>
            <ActivityIndicator color={COLORS.primary} />
          </View>
        )}

        {progress && isHost !== null && (
          <View style={styles.footer}>
            {error && <Text style={styles.inlineError}>{error}</Text>}
            {isHost && (
              <PrimaryButton
                label="탐험 종료하기"
                onPress={handleFinish}
                disabled={!allDone}
                loading={finishing}
              />
            )}
            <Text style={styles.caption}>
              {!isHost
                ? "방장이 탐험을 종료하면 자동으로 넘어가요"
                : allDone
                  ? "탐험을 종료하면 퀘스트 상태를 바꿀 수 없어요"
                  : "퀘스트를 모두 완료하면 탐험을 종료할 수 있어요"}
            </Text>
          </View>
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
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: scale(20),
    paddingTop: verticalScale(8),
    paddingBottom: verticalScale(24),
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  region: {
    fontSize: moderateScale(22),
    fontWeight: "bold",
    color: COLORS.textMain,
    marginBottom: verticalScale(6),
  },
  meta: { fontSize: moderateScale(13), color: COLORS.textSub },

  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: verticalScale(28),
    marginBottom: verticalScale(10),
  },
  progressText: {
    fontSize: moderateScale(14),
    fontWeight: "bold",
    color: COLORS.textMain,
  },
  progressRate: {
    fontSize: moderateScale(13),
    fontWeight: "bold",
    color: COLORS.primary,
  },

  list: { marginTop: verticalScale(34) },

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
