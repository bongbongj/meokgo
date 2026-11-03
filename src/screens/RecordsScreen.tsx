// src/screens/RecordsScreen.tsx
// 11. 내 기록 (12 닉네임 변경 시트 / 13 변경 완료 토스트 / 14 진행한 탐험이 없을 때)
// - 프로필: 닉네임 첫 글자 원 + 닉네임 + 누적 탐험 / 퀘스트 수, 수정 아이콘 → 12 닉네임 변경 시트
// - 통계: 완료한 탐험 / 완료한 퀘스트 / 방문한 지역
// - 탐험 기록 카드 → 15 탐험 기록, 기록이 없으면 14 안내 + 새로운 탐험 시작 → 03 조건 선택
// - 화면에 들어올 때마다 다시 조회 (탐험 종료 후 돌아오면 새 기록이 보이도록)

import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SymbolView } from "expo-symbols";
import { router, useFocusEffect } from "expo-router";
import { COLORS } from "../constants/colors";
import { moderateScale, scale, verticalScale } from "../utils/responsive";
import { getStoredNickname, saveStoredNickname } from "../utils/userStorage";
import { isApiError } from "../api/client";
import { USE_MOCK } from "../api/mock";
import {
  fetchMyRecords,
  fetchMyStatistics,
  isMockRecordsEmpty,
  RecordSummary,
  setMockRecordsEmpty,
  UserStatistics,
} from "../api/recordApi";
import { updateNickname } from "../api/userApi";
import { LogoHeader } from "../components/ScreenHeader";
import ProfileAvatar from "../components/ProfileAvatar";
import BottomTabBar from "../components/BottomTabBar";
import { useToast } from "../components/Toast";
import NicknameSheet from "../components/records/NicknameSheet";
import RecordCard from "../components/records/RecordCard";

const getNicknameErrorMessage = (error: unknown): string => {
  if (isApiError(error) && error.code === "USER-002") {
    return "한글, 영문, 숫자로 1~10자까지 쓸 수 있어요";
  }
  return "닉네임을 바꾸지 못했어요. 다시 시도해주세요";
};

export default function RecordsScreen() {
  const [nickname, setNickname] = useState("");
  const [statistics, setStatistics] = useState<UserStatistics | null>(null);
  const [records, setRecords] = useState<RecordSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mockEmpty, setMockEmpty] = useState(isMockRecordsEmpty);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const { showToast, toast } = useToast();

  // 프로필 · 통계 · 기록 목록 조회 (반환값: 화면을 떠날 때 결과를 버리는 정리 함수)
  const load = useCallback(() => {
    let cancelled = false;
    getStoredNickname().then((stored) => {
      if (!cancelled && stored) setNickname(stored);
    });
    Promise.all([fetchMyStatistics(), fetchMyRecords()]).then(
      ([stats, list]) => {
        if (cancelled) return;
        setStatistics(stats);
        setRecords(list.records);
        setError(null);
      },
      (e) => {
        if (!cancelled) setError(isApiError(e) ? e.message : "잠시 후 다시 시도해주세요.");
      },
    );
    return () => {
      cancelled = true;
    };
  }, []);

  useFocusEffect(load);

  const reload = () => {
    setError(null);
    load();
  };

  const toggleMockEmpty = () => {
    setMockRecordsEmpty(!mockEmpty);
    setMockEmpty(!mockEmpty);
    reload();
  };

  const handleSave = async (next: string) => {
    if (saving) return;
    setSaving(true);
    try {
      const result = await updateNickname(next);
      await saveStoredNickname(result.nickname);
      setNickname(result.nickname);
      setSheetOpen(false);
      showToast("닉네임이 변경되었어요", { icon: "check" });
    } catch (e) {
      setSheetOpen(false);
      showToast(getNicknameErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const explorationCount = statistics?.completed_exploration_count ?? 0;
  const questCount = statistics?.completed_quest_count ?? 0;
  const stats = [
    { label: "완료한 탐험", value: explorationCount },
    { label: "완료한 퀘스트", value: questCount },
    { label: "방문한 지역", value: statistics?.visited_region_count ?? 0 },
  ];

  // 2열 카드 행
  const rows: RecordSummary[][] = [];
  records?.forEach((record, index) => {
    if (index % 2 === 0) rows.push([record]);
    else rows[rows.length - 1].push(record);
  });

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.mobileWrapper}>
        {__DEV__ && USE_MOCK.record && (
          <View style={styles.testBar}>
            <TouchableOpacity onPress={toggleMockEmpty} style={styles.testBtn}>
              <Text style={styles.testBtnText}>
                {mockEmpty ? "기록 있음 보기" : "기록 없음(14) 보기"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <LogoHeader title="MY" />

          {/* 프로필 */}
          <View style={styles.profile}>
            {nickname ? (
              <ProfileAvatar nickname={nickname} size={scale(64)} />
            ) : (
              <View style={styles.avatarEmpty} />
            )}
            <View style={styles.profileTexts}>
              <Text style={styles.nickname}>{nickname}</Text>
              <Text style={styles.profileMeta}>
                탐험 {explorationCount}회 · 완료한 퀘스트 {questCount}개
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setSheetOpen(true)}
              hitSlop={12}
              disabled={!nickname}
              accessibilityRole="button"
              accessibilityLabel="닉네임 변경"
            >
              <SymbolView
                name={{ ios: "pencil", android: "edit", web: "edit" }}
                size={moderateScale(24)}
                tintColor={COLORS.primary}
              />
            </TouchableOpacity>
          </View>

          {/* 통계 */}
          <View style={styles.statsCard}>
            {stats.map((stat, index) => (
              <React.Fragment key={stat.label}>
                {index > 0 && <View style={styles.statDivider} />}
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
              </React.Fragment>
            ))}
          </View>

          {/* 탐험 기록 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>탐험 기록</Text>
            {records === null ? (
              error ? (
                <View style={styles.center}>
                  <Text style={styles.errorText}>{error}</Text>
                  <TouchableOpacity onPress={reload} style={styles.retry}>
                    <Text style={styles.retryText}>다시 시도</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.center}>
                  <ActivityIndicator color={COLORS.primary} />
                </View>
              )
            ) : records.length === 0 ? (
              <>
                <View style={styles.emptyBox}>
                  <Text style={styles.emptyTitle}>아직 진행한 탐험이 없어요</Text>
                  <Text style={styles.emptySub}>
                    친구들과 첫 탐험을 시작하면{"\n"}여기에 기록이 쌓여요
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.newCard}
                  activeOpacity={0.8}
                  onPress={() => router.push("/condition")}
                  accessibilityRole="button"
                >
                  <View>
                    <Text style={styles.newTitle}>새로운 탐험 시작</Text>
                    <Text style={styles.newSub}>지역을 고르고 퀘스트를 함께 선택해요</Text>
                  </View>
                  <View style={styles.arrowCircle}>
                    <SymbolView
                      name={{ ios: "arrow.right", android: "arrow_forward", web: "arrow_forward" }}
                      size={moderateScale(20)}
                      tintColor={COLORS.background}
                    />
                  </View>
                </TouchableOpacity>
              </>
            ) : (
              rows.map((row) => (
                <View key={row[0].record_id} style={styles.cardRow}>
                  {row.map((record) => (
                    <RecordCard
                      key={record.record_id}
                      record={record}
                      onPress={() => router.push(`/records/${record.record_id}`)}
                    />
                  ))}
                  {row.length === 1 && <View style={styles.cardSpacer} />}
                </View>
              ))
            )}
          </View>
        </ScrollView>

        {toast}
        <BottomTabBar active="records" />
      </View>

      <NicknameSheet
        visible={sheetOpen}
        initialNickname={nickname}
        saving={saving}
        onClose={() => setSheetOpen(false)}
        onSave={handleSave}
      />
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
  scrollContent: { paddingBottom: verticalScale(120) },
  center: {
    paddingVertical: verticalScale(40),
    alignItems: "center",
  },

  testBar: {
    flexDirection: "row",
    justifyContent: "center",
    backgroundColor: "#eee",
    padding: scale(4),
  },
  testBtn: {
    paddingVertical: scale(6),
    paddingHorizontal: scale(10),
    borderRadius: scale(4),
  },
  testBtnText: { fontSize: moderateScale(11), fontWeight: "bold" },

  profile: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: scale(24),
    marginTop: verticalScale(4),
  },
  avatarEmpty: {
    width: scale(64),
    height: scale(64),
    borderRadius: scale(32),
    backgroundColor: COLORS.cardBg,
  },
  profileTexts: { flex: 1, marginLeft: scale(22) },
  nickname: {
    fontSize: moderateScale(20),
    fontWeight: "bold",
    color: COLORS.textMain,
    marginBottom: verticalScale(8),
  },
  profileMeta: { fontSize: moderateScale(14), color: COLORS.textSub },

  statsCard: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: scale(18),
    marginTop: verticalScale(22),
    paddingVertical: verticalScale(16),
    borderRadius: scale(16),
    backgroundColor: COLORS.cardBg,
  },
  stat: { flex: 1, alignItems: "center" },
  statDivider: {
    width: 1,
    height: verticalScale(32),
    backgroundColor: COLORS.border,
  },
  statValue: {
    fontSize: moderateScale(20),
    fontWeight: "bold",
    color: COLORS.textMain,
    marginBottom: verticalScale(4),
  },
  statLabel: { fontSize: moderateScale(12), color: COLORS.textSub },

  section: {
    marginTop: verticalScale(28),
    paddingHorizontal: scale(20),
  },
  sectionTitle: {
    fontSize: moderateScale(18),
    fontWeight: "bold",
    color: COLORS.textMain,
    marginBottom: verticalScale(12),
  },
  cardRow: {
    flexDirection: "row",
    gap: scale(16),
    marginBottom: verticalScale(20),
  },
  cardSpacer: { flex: 1 },

  emptyBox: {
    alignItems: "center",
    justifyContent: "center",
    height: verticalScale(165),
    borderRadius: scale(24),
    backgroundColor: COLORS.cardBg,
  },
  emptyTitle: {
    fontSize: moderateScale(16),
    fontWeight: "bold",
    color: COLORS.textMain,
    marginBottom: verticalScale(12),
  },
  emptySub: {
    fontSize: moderateScale(13),
    color: COLORS.textMuted,
    textAlign: "center",
    lineHeight: moderateScale(17),
  },
  newCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: verticalScale(72),
    marginTop: verticalScale(16),
    paddingLeft: scale(20),
    paddingRight: scale(14),
    borderRadius: scale(28),
    backgroundColor: COLORS.cardBg,
  },
  newTitle: {
    fontSize: moderateScale(17),
    fontWeight: "bold",
    color: COLORS.textMain,
    marginBottom: verticalScale(4),
  },
  newSub: { fontSize: moderateScale(13), color: COLORS.textSub },
  arrowCircle: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
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
});
