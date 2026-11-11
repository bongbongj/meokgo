// src/screens/JoinClosedScreen.tsx

import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SymbolView } from "expo-symbols";
import { router, useLocalSearchParams } from "expo-router";
import { COLORS } from "../constants/colors";
import { scale, verticalScale, moderateScale } from "../utils/responsive";
import { NavHeader } from "../components/ScreenHeader";
import type { UnjoinableReason } from "../api/inviteApi";
import { MAX_PARTICIPANT_COUNT } from "../api/roomApi";

// 06-1 시안 문구 — 화면정의: 탐험이 이미 종료된 경우에도 동일한 안내를 사용
const ALREADY_STARTED_MESSAGE = {
  title: "이미 시작된 탐험이에요",
  body: "투표가 시작되어 더 이상 참여할 수 없어요\n다음 탐험에 함께해주세요",
};

// 정원 초과·만료·잘못된 링크는 시안에 없어 같은 패턴으로 문구만 바꿔 안내
const MESSAGES: Record<UnjoinableReason, { title: string; body: string }> = {
  ALREADY_STARTED: ALREADY_STARTED_MESSAGE,
  FINISHED: ALREADY_STARTED_MESSAGE,
  FULL: {
    title: "참여 인원이 가득 찼어요",
    body: `최대 ${MAX_PARTICIPANT_COUNT}명까지 참여할 수 있어요\n다음 탐험에 함께해주세요`,
  },
  EXPIRED: {
    title: "만료된 초대 링크예요",
    body: "초대 링크는 24시간 동안만 사용할 수 있어요\n친구에게 새 링크를 요청해주세요",
  },
  INVALID_LINK: {
    title: "잘못된 초대 링크예요",
    body: "링크 주소를 다시 확인해주세요",
  },
};

/**
 * 06-1. 참여 마감 (투표 시작·종료·정원 초과·잘못된 링크)
 */
export default function JoinClosedScreen() {
  const { reason } = useLocalSearchParams<{ reason: UnjoinableReason }>();
  const message = MESSAGES[reason] ?? MESSAGES.INVALID_LINK;

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.mobileWrapper}>
        <NavHeader title="참여하기" />

        <View style={styles.content}>
          <View style={styles.iconCircle}>
            <SymbolView
              name={{ ios: "lock", android: "lock", web: "lock" }}
              size={moderateScale(30)}
              tintColor={COLORS.primary}
            />
          </View>
          <Text style={styles.title}>{message.title}</Text>
          <Text style={styles.body}>{message.body}</Text>
        </View>

        <View style={styles.bottomArea}>
          <TouchableOpacity
            style={styles.ctaButton}
            activeOpacity={0.8}
            onPress={() => router.replace("/home")}
          >
            <Text style={styles.ctaText}>홈으로 가기</Text>
          </TouchableOpacity>
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
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: scale(20),
  },
  iconCircle: {
    width: scale(72),
    height: scale(72),
    borderRadius: scale(36),
    backgroundColor: COLORS.coralTint,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: verticalScale(24),
  },
  title: {
    fontSize: moderateScale(20),
    fontWeight: "bold",
    color: COLORS.textMain,
    marginBottom: verticalScale(8),
  },
  body: {
    fontSize: moderateScale(13),
    lineHeight: moderateScale(18),
    color: COLORS.textSub,
    textAlign: "center",
  },
  bottomArea: {
    paddingHorizontal: scale(20),
    paddingBottom: verticalScale(60),
  },
  ctaButton: {
    height: verticalScale(52),
    borderRadius: scale(14),
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  ctaText: {
    fontSize: moderateScale(16),
    fontWeight: "bold",
    color: COLORS.background,
  },
});
