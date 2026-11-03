// src/components/ScreenHeader.tsx

import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SymbolView } from "expo-symbols";
import { COLORS } from "../constants/colors";
import { scale, verticalScale, moderateScale } from "../utils/responsive";

/**
 * 로고 + 큰 타이틀 헤더 (03 오늘의 탐험, 07 참여 대기, 09 퀘스트 투표)
 * subtitle이 있으면 타이틀 아래 안내 문구 표시
 */
export function LogoHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <View style={styles.logoHeaderWrapper}>
      <View style={styles.logoHeader}>
        <Image
          source={require("../../assets/images/Logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.logoTitle}>{title}</Text>
      </View>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
}

/**
 * 가운데 타이틀 네비 헤더 (06-1 참여하기, 07-1 참여 대기)
 * onBack이 없으면 뒤로가기 버튼을 숨김
 */
export function NavHeader({
  title,
  onBack,
}: {
  title: string;
  onBack?: () => void;
}) {
  return (
    <View style={styles.navHeader}>
      {onBack && (
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          hitSlop={12}
          accessibilityLabel="뒤로가기"
        >
          <SymbolView
            name={{
              ios: "chevron.left",
              android: "arrow_back_ios_new",
              web: "arrow_back_ios_new",
            }}
            size={moderateScale(22)}
            tintColor={COLORS.textMain}
          />
        </TouchableOpacity>
      )}
      <Text style={styles.navTitle}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  logoHeaderWrapper: { paddingBottom: verticalScale(12) },
  logoHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: scale(20),
    paddingTop: verticalScale(16),
  },
  logo: { width: scale(34), height: scale(34), marginRight: scale(10) },
  logoTitle: {
    fontSize: moderateScale(26),
    fontWeight: "bold",
    color: COLORS.textMain,
  },
  subtitle: {
    marginTop: verticalScale(28),
    paddingHorizontal: scale(20),
    fontSize: moderateScale(15),
    color: COLORS.textSub,
  },

  navHeader: {
    height: verticalScale(44),
    marginTop: verticalScale(8),
    justifyContent: "center",
    alignItems: "center",
  },
  backButton: { position: "absolute", left: scale(20) },
  navTitle: {
    fontSize: moderateScale(17),
    fontWeight: "bold",
    color: COLORS.textMain,
  },
});
