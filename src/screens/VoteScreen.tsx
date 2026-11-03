// src/screens/VoteScreen.tsx
// 09. 퀘스트 투표
// - 후보 6개 중 최소 1개 ~ 최대 3개 선택 (3개 선택 후 추가 선택은 반응 없음)
// - 이미 투표했다면 기존 선택을 복원하고, 제출 시 덮어쓴다 (마지막 제출만 집계)
// - 제출 후 투표 대기 화면으로 이동

import React, { useEffect, useState } from "react";
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
import { isApiError } from "../api/client";
import {
  fetchQuestCandidates,
  QuestCandidateList,
  submitMyVote,
} from "../api/voteApi";
import { LogoHeader } from "../components/ScreenHeader";
import CheckCircle from "../components/common/CheckCircle";
import PrimaryButton from "../components/common/PrimaryButton";

interface VoteScreenProps {
  roomId: number;
}

const getErrorMessage = (error: unknown): string => {
  if (!isApiError(error)) return "잠시 후 다시 시도해주세요.";
  switch (error.code) {
    case "VOTE-001":
      return "이미 마감된 투표예요.";
    case "VOTE-002":
      return "퀘스트는 1개부터 3개까지 선택할 수 있어요.";
    case "QUEST-003":
      return "조건에 맞는 퀘스트가 부족해요. 탐험 조건을 다시 설정해주세요.";
    case "PARTICIPANT-001":
      return "이 탐험방의 참여자가 아니에요.";
    default:
      return error.message;
  }
};

export default function VoteScreen({ roomId }: VoteScreenProps) {
  const [data, setData] = useState<QuestCandidateList | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isEdit, setIsEdit] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  // 후보 조회 + 내 기존 선택 복원
  useEffect(() => {
    let cancelled = false;
    fetchQuestCandidates(roomId).then(
      (result) => {
        if (cancelled) return;
        const mySelection = result.candidates
          .filter((candidate) => candidate.selected)
          .map((candidate) => candidate.candidate_id);
        setData(result);
        setSelectedIds(mySelection);
        setIsEdit(mySelection.length > 0);
      },
      (error) => {
        if (!cancelled) setLoadError(getErrorMessage(error));
      },
    );
    return () => {
      cancelled = true;
    };
  }, [roomId, reloadKey]);

  const retry = () => {
    setLoadError(null);
    setReloadKey((key) => key + 1);
  };

  const maxCount = data?.max_select_count ?? 3;
  const minCount = data?.min_select_count ?? 1;
  const selectedCount = selectedIds.length;
  const canSubmit = selectedCount >= minCount && selectedCount <= maxCount;

  const toggle = (candidateId: number) => {
    setSubmitError(null);
    setSelectedIds((prev) => {
      if (prev.includes(candidateId)) {
        return prev.filter((id) => id !== candidateId);
      }
      if (prev.length >= maxCount) return prev; // 최대 개수 도달 시 반응 없음
      return [...prev, candidateId];
    });
  };

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await submitMyVote(roomId, selectedIds, isEdit);
      router.replace(`/rooms/${roomId}/vote-status`);
    } catch (error) {
      if (isApiError(error) && error.code === "VOTE-001") {
        router.replace(`/rooms/${roomId}/confirm`);
        return;
      }
      setSubmitError(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.mobileWrapper}>
        <LogoHeader
          title="퀘스트 투표"
          subtitle={`최대 ${maxCount}개 투표`}
        />

        {!data ? (
          <View style={styles.center}>
            {loadError ? (
              <>
                <Text style={styles.errorText}>{loadError}</Text>
                <TouchableOpacity onPress={retry} style={styles.retry}>
                  <Text style={styles.retryText}>다시 시도</Text>
                </TouchableOpacity>
              </>
            ) : (
              <ActivityIndicator color={COLORS.primary} />
            )}
          </View>
        ) : (
          <>
            <Text style={styles.counter}>
              {selectedCount}/{maxCount} 선택
            </Text>

            <ScrollView
              style={styles.list}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            >
              {data.candidates.map((candidate) => {
                const checked = selectedIds.includes(candidate.candidate_id);
                return (
                  <TouchableOpacity
                    key={candidate.candidate_id}
                    style={[styles.item, checked && styles.itemChecked]}
                    onPress={() => toggle(candidate.candidate_id)}
                    activeOpacity={0.7}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked }}
                  >
                    <Text
                      style={[styles.itemTitle, checked && styles.itemTitleChecked]}
                      numberOfLines={2}
                    >
                      {candidate.quest_title}
                    </Text>
                    <CheckCircle checked={checked} />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={styles.footer}>
              {submitError && (
                <Text style={styles.submitError}>{submitError}</Text>
              )}
              <PrimaryButton
                label={`선택 완료 ${selectedCount}/${maxCount}`}
                onPress={handleSubmit}
                disabled={!canSubmit}
                loading={submitting}
              />
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
  errorText: {
    fontSize: moderateScale(14),
    color: COLORS.textSub,
    textAlign: "center",
    paddingHorizontal: scale(20),
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

  counter: {
    alignSelf: "flex-end",
    marginTop: verticalScale(24),
    marginBottom: verticalScale(16),
    paddingHorizontal: scale(20),
    fontSize: moderateScale(13),
    fontWeight: "bold",
    color: COLORS.primary,
  },
  list: { flex: 1 },
  listContent: { paddingHorizontal: scale(20) },
  // 디자인: 선택 박스 높이 66, 항목 간격 72
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
  itemTitle: {
    flex: 1,
    marginRight: scale(12),
    fontSize: moderateScale(15),
    color: COLORS.textMain,
  },
  itemTitleChecked: { fontWeight: "bold" },

  footer: {
    paddingHorizontal: scale(20),
    paddingTop: verticalScale(12),
    paddingBottom: verticalScale(16),
  },
  submitError: {
    marginBottom: verticalScale(8),
    fontSize: moderateScale(12),
    color: COLORS.primary,
    textAlign: "center",
  },
});
