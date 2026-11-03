// src/screens/ExplorationFinishScreen.tsx
// 18. 탐험 종료
// - 종료 안내 + 탐험 요약(지역명 / 날짜 / 대표 참여자 외 N명 / 완료한 퀘스트 수)
// - 탐험 기록 보러가기 → 15 탐험 기록
// - 종료된 탐험의 진행 조회로 요약과 기록 번호를 가져온다 (record_id는 API명세서에 없음 — README 컨펌 필요 사항)

import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
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
import { fetchRoomDetail } from "../api/voteApi";
import { ExplorationProgress, fetchExplorationProgress } from "../api/explorationApi";
import { NavHeader } from "../components/ScreenHeader";
import PrimaryButton from "../components/common/PrimaryButton";

interface ExplorationFinishScreenProps {
  roomId: number;
}

export default function ExplorationFinishScreen({ roomId }: ExplorationFinishScreenProps) {
  const [progress, setProgress] = useState<ExplorationProgress | null>(null);
  const [hostNickname, setHostNickname] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchExplorationProgress(roomId), fetchRoomDetail(roomId)]).then(
      ([result, detail]) => {
        if (cancelled) return;
        const host = detail.participants.find((p) => p.role === "HOST");
        setHostNickname(host?.nickname ?? detail.participants[0]?.nickname ?? "");
        setProgress(result);
      },
      (e) => {
        if (!cancelled) setError(isApiError(e) ? e.message : "잠시 후 다시 시도해주세요.");
      },
    );
    return () => {
      cancelled = true;
    };
  }, [roomId, reloadKey]);

  const retry = () => {
    setError(null);
    setReloadKey((key) => key + 1);
  };

  const recordId = progress?.record_id ?? null;
  const others = (progress?.participant_count ?? 0) - 1;
  const people = others > 0 ? `${hostNickname} 외 ${others}명` : hostNickname;

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.mobileWrapper}>
        <NavHeader title="탐험 종료" onBack={() => router.replace("/home")} />

        <View style={styles.body}>
          <View style={styles.hero}>
            <Image
              source={require("../../assets/images/Logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.title}>탐험이 종료됐어요!</Text>
            <Text style={styles.subtitle}>즐거우셨나요?</Text>
          </View>

          {progress ? (
            <View style={styles.card}>
              <Text style={styles.region}>{progress.region_name} 탐험</Text>
              <Text style={styles.meta}>
                {formatDotDate()}
                {people ? ` · ${people}` : ""}
              </Text>
              <View style={styles.divider} />
              <View style={styles.row}>
                <Text style={styles.rowLabel}>완료한 퀘스트</Text>
                <Text style={styles.rowValue}>
                  {progress.completed_quest_count} / {progress.total_quest_count}
                </Text>
              </View>
            </View>
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

        <View style={styles.footer}>
          <PrimaryButton
            label="탐험 기록 보러가기"
            onPress={() => recordId && router.push(`/records/${recordId}`)}
            disabled={!recordId}
          />
          <Text style={styles.caption}>기록은 내 기록에서 언제든 다시 볼 수 있어요</Text>
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
  body: { flex: 1, paddingHorizontal: scale(20) },
  center: {
    paddingTop: verticalScale(40),
    alignItems: "center",
  },

  hero: {
    alignItems: "center",
    paddingTop: verticalScale(64),
    paddingBottom: verticalScale(88),
  },
  logo: {
    width: scale(92),
    height: scale(92),
    marginBottom: verticalScale(28),
  },
  title: {
    fontSize: moderateScale(18),
    fontWeight: "bold",
    color: COLORS.textMain,
    marginBottom: verticalScale(8),
  },
  subtitle: { fontSize: moderateScale(13), color: COLORS.textSub },

  card: {
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(20),
    borderRadius: scale(16),
    backgroundColor: COLORS.cardBg,
  },
  region: {
    fontSize: moderateScale(16),
    fontWeight: "bold",
    color: COLORS.textMain,
    marginBottom: verticalScale(4),
  },
  meta: { fontSize: moderateScale(12), color: COLORS.textSub },
  divider: {
    height: 1,
    backgroundColor: COLORS.divider,
    marginVertical: verticalScale(14),
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rowLabel: { fontSize: moderateScale(13), color: COLORS.textSub },
  rowValue: {
    fontSize: moderateScale(13),
    fontWeight: "bold",
    color: COLORS.primary,
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
  caption: {
    marginTop: verticalScale(10),
    fontSize: moderateScale(12),
    color: COLORS.textMuted,
    textAlign: "center",
  },
});
