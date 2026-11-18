// src/screens/ConditionScreen.tsx

import React, { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "../components/common/Icon";
import LocationIcon from "../components/common/LocationIcon";
import PhotoImage from "../components/common/PhotoImage";
import { router, useLocalSearchParams } from "expo-router";
import { COLORS } from "../constants/colors";
import { scale, verticalScale, moderateScale } from "../utils/responsive";
import { LogoHeader } from "../components/ScreenHeader";
import RegionSelectSheet, {
  SelectedRegion,
} from "../components/RegionSelectSheet";
import { fetchRecentRegions, RecentRegion } from "../api/regionApi";
import { isApiError } from "../api/client";
import { createRoom, DrinkingOption, ScheduleType } from "../api/roomApi";
import { useToast } from "../components/Toast";
import {
  DRINKING_OPTIONS,
  SCHEDULE_OPTIONS,
} from "../constants/conditionLabels";

/**
 * 03. 오늘의 탐험 (조건 선택)
 * - 지역은 반드시 1개 선택해야 진행 가능
 * - 피하고 싶은 음식은 건너뛸 수 있음
 * - 고른 지역에 대표 이미지가 있으면 '최근 선택' 자리에 사진 카드를 보여준다
 *   (같은 높이로 자리를 바꿔서 아래 입력칸·버튼이 밀려 스크롤이 생기지 않게 한다)
 */
export default function ConditionScreen() {
  // 홈의 인기 지역에서 진입하면 해당 지역이 미리 선택됨
  const params = useLocalSearchParams<{
    regionId?: string;
    regionName?: string;
    regionImageUrl?: string;
  }>();

  const [region, setRegion] = useState<SelectedRegion | null>(
    params.regionId && params.regionName
      ? {
          region_id: Number(params.regionId),
          region_name: params.regionName,
          region_image_url: params.regionImageUrl || null,
        }
      : null,
  );
  const [schedule, setSchedule] = useState<ScheduleType>("MEAL");
  const [drinking, setDrinking] = useState<DrinkingOption>("ANY");
  const [avoidFoods, setAvoidFoods] = useState("");
  const [recentRegions, setRecentRegions] = useState<RecentRegion[]>([]);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  // '최근 선택' 영역의 실제 높이 — 사진 카드를 같은 높이로 맞춰 아래 내용이 밀리지 않게 한다
  const [recentSlotHeight, setRecentSlotHeight] = useState<number | null>(null);
  const { showToast, toast } = useToast();

  useEffect(() => {
    let ignore = false;
    fetchRecentRegions()
      .then((res) => {
        if (!ignore) setRecentRegions(res.data.recent_regions);
      })
      .catch(() => {});
    return () => {
      ignore = true;
    };
  }, []);

  const canSubmit = region !== null && !isLoading;

  const handleCreate = async () => {
    if (!region || isLoading) return;
    setIsLoading(true);
    try {
      const res = await createRoom({
        region_id: region.region_id,
        region_name: region.region_name,
        schedule_type: schedule,
        drinking_option: drinking,
        avoid_foods: avoidFoods.trim() || undefined,
      });
      router.replace({
        pathname: "/room-created",
        params: {
          roomId: String(res.data.room_id),
          inviteUrl: res.data.invite_url,
        },
      });
    } catch (error) {
      // 서버 사전에 없는 기피 음식 표현은 COMMON-001 + avoid_foods 필드 오류로 내려온다
      const isAvoidFoodsError =
        isApiError(error) &&
        error.code === "COMMON-001" &&
        error.errors.some((e) => e.field === "avoid_foods");
      showToast(
        isAvoidFoodsError
          ? "인식하지 못한 음식이 있어요. 다른 표현으로 적어주세요"
          : isApiError(error) && error.code === "QUEST-003"
            ? "조건에 맞는 퀘스트가 부족해요. 조건을 바꿔주세요"
            : "탐험방을 만들지 못했어요. 다시 시도해주세요",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={styles.mobileWrapper}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <LogoHeader title="오늘의 탐험" />

          <View style={styles.body}>
            {/* 지역 */}
            <View style={styles.regionLabelRow}>
              <LocationIcon size={moderateScale(22)} color={COLORS.textMain} />
              <Text style={styles.sectionTitle}>지역</Text>
            </View>

            <TouchableOpacity
              style={styles.field}
              activeOpacity={0.8}
              onPress={() => setIsSheetOpen(true)}
            >
              <Icon name="locationField" size={moderateScale(21)} color={region ? COLORS.primary : "#C4C4C4"} />
              <Text
                style={[styles.fieldText, !region && styles.placeholder]}
                numberOfLines={1}
              >
                {region ? region.region_name : "지역을 선택해주세요"}
              </Text>
            </TouchableOpacity>

            {/* 고른 지역의 대표 사진 (누르면 지역 다시 고르기) — 없으면 최근 선택 */}
            {region?.region_image_url ? (
              <TouchableOpacity
                style={[
                  styles.regionCard,
                  recentSlotHeight !== null && {
                    height: recentSlotHeight - styles.regionCard.marginTop,
                  },
                ]}
                activeOpacity={0.9}
                onPress={() => setIsSheetOpen(true)}
                accessibilityRole="button"
                accessibilityLabel={`${region.region_name} 대표 사진, 눌러서 지역 바꾸기`}
              >
                <PhotoImage url={region.region_image_url} style={styles.regionCardImage} />
                <View style={styles.regionCardLabel}>
                  <Text style={styles.regionCardText} numberOfLines={1}>
                    {region.region_name}
                  </Text>
                </View>
              </TouchableOpacity>
            ) : recentRegions.length > 0 && (
              <View
                onLayout={(e) => setRecentSlotHeight(e.nativeEvent.layout.height)}
              >
                <Text style={styles.recentLabel}>최근 선택</Text>
                <View style={styles.recentRow}>
                  {recentRegions.map((recent) => {
                    const isSelected = recent.region_id === region?.region_id;
                    return (
                      <TouchableOpacity
                        key={recent.region_id}
                        style={styles.recentItem}
                        activeOpacity={0.7}
                        onPress={() => setRegion(recent)}
                      >
                        {/* 지역 대표 이미지 (없으면 회색 기본 원) */}
                        {recent.region_image_url ? (
                          <PhotoImage
                            url={recent.region_image_url}
                            style={[
                              styles.recentCircle,
                              isSelected && styles.recentCircleSelected,
                            ]}
                          />
                        ) : (
                          <View
                            style={[
                              styles.recentCircle,
                              isSelected && styles.recentCircleSelected,
                            ]}
                          />
                        )}
                        <Text
                          style={[
                            styles.recentText,
                            isSelected && styles.recentTextSelected,
                          ]}
                        >
                          {recent.region_name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* 일정 */}
            <Text style={[styles.sectionTitle, styles.sectionSpacing]}>일정</Text>
            <View style={[styles.optionRow, { gap: scale(8) }]}>
              {SCHEDULE_OPTIONS.map((option) => (
                <OptionPill
                  key={option.value}
                  label={option.label}
                  selected={schedule === option.value}
                  onPress={() => setSchedule(option.value)}
                />
              ))}
            </View>

            {/* 음주 여부 */}
            <Text style={[styles.sectionTitle, styles.sectionSpacing]}>
              음주 여부
            </Text>
            <View style={[styles.optionRow, { gap: scale(16) }]}>
              {DRINKING_OPTIONS.map((option) => (
                <OptionPill
                  key={option.value}
                  label={option.label}
                  selected={drinking === option.value}
                  onPress={() => setDrinking(option.value)}
                />
              ))}
            </View>

            {/* 피하고 싶은 음식 */}
            <Text style={[styles.sectionTitle, styles.sectionSpacing]}>
              피하고싶은 음식
            </Text>
            <View style={styles.field}>
              <Icon name="forkSpoon" size={moderateScale(21)} color="#C4C4C4" />
              <TextInput
                style={styles.input}
                placeholder="없다면 건너뛰어도 돼요"
                placeholderTextColor={COLORS.textMuted}
                value={avoidFoods}
                onChangeText={setAvoidFoods}
                maxLength={500}
                returnKeyType="done"
              />
            </View>
          </View>
        </ScrollView>

        {/* 탐험방 만들기 */}
        <View style={styles.bottomArea}>
          <TouchableOpacity
            style={[styles.ctaButton, !canSubmit && styles.ctaButtonDisabled]}
            disabled={!canSubmit}
            activeOpacity={0.8}
            onPress={handleCreate}
          >
            <Text style={[styles.ctaText, !canSubmit && styles.ctaTextDisabled]}>
              탐험방 만들기
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <RegionSelectSheet
        visible={isSheetOpen}
        selected={region}
        onSelect={setRegion}
        onClose={() => setIsSheetOpen(false)}
      />
      {toast}
    </SafeAreaView>
  );
}

function OptionPill({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.pill, selected && styles.pillSelected]}
      activeOpacity={0.8}
      onPress={onPress}
    >
      <Text style={[styles.pillText, selected && styles.pillTextSelected]}>
        {label}
      </Text>
    </TouchableOpacity>
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
  body: { paddingHorizontal: scale(20) },

  regionLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(4),
    marginTop: verticalScale(8),
    marginBottom: verticalScale(14),
  },
  sectionTitle: {
    fontSize: moderateScale(17),
    fontWeight: "bold",
    color: COLORS.textMain,
  },
  sectionSpacing: {
    marginTop: verticalScale(32),
    marginBottom: verticalScale(14),
  },

  field: {
    height: verticalScale(52),
    flexDirection: "row",
    alignItems: "center",
    gap: scale(10),
    backgroundColor: COLORS.background,
    borderRadius: scale(14),
    paddingHorizontal: scale(16),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  fieldText: {
    flex: 1,
    fontSize: moderateScale(16),
    color: COLORS.textMain,
  },
  placeholder: { color: COLORS.textMuted },
  input: {
    flex: 1,
    height: "100%",
    fontSize: moderateScale(16),
    color: COLORS.textMain,
    paddingVertical: 0,
    ...(Platform.OS === "web" ? ({ outlineStyle: "none" } as any) : {}),
  },

  // 최근 선택 영역(라벨 + 원 + 지역명)과 같은 높이 — 실제 높이를 재기 전에 쓰는 기본값
  regionCard: {
    marginTop: verticalScale(16),
    height: verticalScale(34) + scale(65) + moderateScale(40),
    borderRadius: scale(14),
    overflow: "hidden",
    backgroundColor: "#ddd",
  },
  regionCardImage: { width: "100%", height: "100%" },
  regionCardLabel: {
    position: "absolute",
    left: scale(12),
    bottom: verticalScale(10),
    maxWidth: "80%",
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(4),
    borderRadius: 999,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
  },
  regionCardText: {
    fontSize: moderateScale(14),
    fontWeight: "bold",
    color: COLORS.background,
  },

  recentLabel: {
    fontSize: moderateScale(14),
    color: COLORS.textSub,
    marginTop: verticalScale(28),
    marginBottom: verticalScale(14),
  },
  recentRow: {
    flexDirection: "row",
    justifyContent: "space-evenly",
  },
  recentItem: { alignItems: "center" },
  recentCircle: {
    width: scale(65),
    height: scale(65),
    borderRadius: scale(32.5),
    backgroundColor: "#ddd",
    marginBottom: verticalScale(8),
    borderWidth: 2,
    borderColor: "transparent",
  },
  recentCircleSelected: { borderColor: COLORS.primary },
  recentText: { fontSize: moderateScale(14), color: COLORS.textMain },
  recentTextSelected: { color: COLORS.primary, fontWeight: "bold" },

  optionRow: { flexDirection: "row" },
  pill: {
    flex: 1,
    height: verticalScale(40),
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: scale(12),
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  pillSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  pillText: { fontSize: moderateScale(15), color: COLORS.textMain },
  pillTextSelected: { color: COLORS.background, fontWeight: "bold" },

  bottomArea: {
    paddingHorizontal: scale(20),
    paddingTop: verticalScale(8),
    paddingBottom: verticalScale(12),
  },
  ctaButton: {
    height: verticalScale(52),
    borderRadius: scale(14),
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  ctaButtonDisabled: { backgroundColor: COLORS.disabledBg },
  ctaText: {
    fontSize: moderateScale(16),
    fontWeight: "bold",
    color: COLORS.background,
  },
  ctaTextDisabled: { color: COLORS.disabledText },
});
