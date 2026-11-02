// src/components/common/LogoHeader.tsx
// 로고 + 큰 타이틀 헤더 (퀘스트 투표, 내 기록, 기록 남기기 등)

import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { COLORS } from "../../constants/colors";
import { moderateScale, scale, verticalScale } from "../../utils/responsive";

interface LogoHeaderProps {
  title: string;
  subtitle?: string;
}

export default function LogoHeader({ title, subtitle }: LogoHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <Image
          source={require("../../../assets/images/Logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>{title}</Text>
      </View>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: scale(20),
    paddingTop: verticalScale(4),
    paddingBottom: verticalScale(8),
  },
  titleRow: { flexDirection: "row", alignItems: "center" },
  logo: { width: scale(40), height: scale(40), marginRight: scale(7) },
  title: {
    fontSize: moderateScale(24),
    fontWeight: "bold",
    color: COLORS.textMain,
  },
  subtitle: {
    marginTop: verticalScale(28),
    fontSize: moderateScale(15),
    color: COLORS.textSub,
  },
});
