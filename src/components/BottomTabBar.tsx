// src/components/BottomTabBar.tsx
// 하단 알약 탭바 (홈 · 탐험 · 내 기록) — 02 홈, 11 ~ 15 내 기록 / 탐험 기록
// HomeScreen에서 분리 (FE 협업 규칙 2장: 하단 내비게이션은 FE1 담당, (tabs)/_layout.tsx가 생기면 그쪽으로 옮긴다)
// 화면 하단에 absolute로 붙으므로, 화면 스크롤 영역은 아래쪽 여백(약 120)을 둔다.

import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SymbolView, type SymbolViewProps } from "expo-symbols";
import { router } from "expo-router";
import { COLORS } from "../constants/colors";
import { scale, verticalScale, moderateScale } from "../utils/responsive";

export type BottomTabKey = "home" | "explore" | "records";

// 하단 탭 (아이콘 파일 전달 전까지 시스템 심볼 사용)
const TABS: {
  key: BottomTabKey;
  label: string;
  icon: SymbolViewProps["name"];
  href: "/home" | "/condition" | "/records";
}[] = [
  {
    key: "home",
    label: "홈",
    icon: { ios: "house", android: "home", web: "home" },
    href: "/home",
  },
  {
    key: "explore",
    label: "탐험",
    icon: { ios: "safari", android: "explore", web: "explore" },
    href: "/condition",
  },
  {
    key: "records",
    label: "내 기록",
    icon: { ios: "person", android: "person", web: "person" },
    href: "/records",
  },
];

interface BottomTabBarProps {
  active: BottomTabKey;
  /** 현재 탭을 다시 눌렀을 때 이동할지 (15 탐험 기록 → 11 내 기록처럼 하위 화면에서 사용) */
  activeNavigable?: boolean;
}

export default function BottomTabBar({ active, activeNavigable = false }: BottomTabBarProps) {
  return (
    <View style={styles.bottomTabBar}>
      {TABS.map((tab) => {
        const isActive = tab.key === active;
        const color = isActive ? COLORS.primary : COLORS.textMain;
        return (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tabItem, isActive && styles.tabItemActive]}
            activeOpacity={0.7}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            onPress={() => {
              if (!isActive) router.push(tab.href);
              else if (activeNavigable) router.replace(tab.href);
            }}
          >
            <SymbolView name={tab.icon} size={moderateScale(24)} tintColor={color} />
            <Text style={[styles.tabText, { color }, isActive && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bottomTabBar: {
    position: "absolute",
    bottom: verticalScale(36),
    width: scale(302),
    height: verticalScale(62),
    backgroundColor: COLORS.cardBg,
    borderRadius: scale(31),
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    padding: scale(3),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
  },
  tabItem: {
    flex: 1,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: scale(28),
  },
  tabItemActive: { backgroundColor: COLORS.tabActiveBg },
  tabText: {
    fontSize: moderateScale(11),
    marginTop: verticalScale(4),
  },
  tabTextActive: { fontWeight: "bold" },
});
