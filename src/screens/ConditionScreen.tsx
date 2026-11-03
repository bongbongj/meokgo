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
import { SymbolView } from "expo-symbols";
import { router, useLocalSearchParams } from "expo-router";
import { COLORS } from "../constants/colors";
import { scale, verticalScale, moderateScale } from "../utils/responsive";
import { LogoHeader } from "../components/ScreenHeader";
import RegionSelectSheet, {
  SelectedRegion,
} from "../components/RegionSelectSheet";
import { fetchRecentRegions, RecentRegion } from "../api/regionApi";
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
 */
export default function ConditionScreen() {
  // 홈의 인기 지역에서 진입하면 해당 지역이 미리 선택됨
  const params = useLocalSearchParams<{
    regionId?: string;
    regionName?: string;
  }>();

  const [region, setRegion] = useState<SelectedRegion | null>(
    params.regionId && params.regionName
      ? { region_id: Number(params.regionId), region_name: params.regionName }
      : null,
  );
  const [schedule, setSchedule] = useState<ScheduleType>("MEAL");
  const [drinking, setDrinking] = useState<DrinkingOption>("ANY");
  const [avoidFoods, setAvoidFoods] = useState("");
  const [recentRegions, setRecentRegions] = useState<RecentRegion[]>([]);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { showToast, toast } = useToast();

  useEffect(() => {
    let ignore = false;
    fetchRecentRegions().then((res) => {
      if (!ignore) setRecentRegions(res.data.recent_regions);
    });
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
    } catch {
      showToast("탐험방을 만들지 못했어요. 다시 시도해주세요");
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
              <SymbolView
                name={{ ios: "mappin.circle.fill", android: "location_on", web: "location_on" }}
                size={moderateScale(22)}
                tintColor={COLORS.textMain}
              />
              <Text style={styles.sectionTitle}>지역</Text>
              <SymbolView
                name={{ ios: "chevron.down", android: "keyboard_arrow_down", web: "keyboard_arrow_down" }}
                size={moderateScale(20)}
                tintColor={COLORS.textMain}
              />
            </View>

            <TouchableOpacity
              style={styles.field}
              activeOpacity={0.8}
              onPress={() => setIsSheetOpen(true)}
            >
              <SymbolView
                name={{ ios: "mappin.circle.fill", android: "location_on", web: "location_on" }}
                size={moderateScale(24)}
                tintColor={region ? COLORS.primary : "#C4C4C4"}
              />
              <Text
                style={[styles.fieldText, !region && styles.placeholder]}
                numberOfLines={1}
              >
                {region ? region.region_name : "지역을 선택해주세요"}
              </Text>
            </TouchableOpacity>

            {/* 최근 선택 */}
            {recentRegions.length > 0 && (
              <>
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
                        {/* 지역 이미지는 API 필드 추가 후 연결 */}
                        <View
                          style={[
                            styles.recentCircle,
                            isSelected && styles.recentCircleSelected,
                          ]}
                        />
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
              </>
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
              <SymbolView
                name={{ ios: "fork.knife", android: "restaurant", web: "restaurant" }}
                size={moderateScale(22)}
                tintColor="#C4C4C4"
              />
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
