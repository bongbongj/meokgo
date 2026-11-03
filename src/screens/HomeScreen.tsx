// src/screens/HomeScreen.tsx

import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  StatusBar,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SymbolView, type SymbolViewProps } from "expo-symbols";
import { router } from "expo-router";
import { COLORS } from "../constants/colors";
import { scale, verticalScale, moderateScale } from "../utils/responsive";
import { fetchHomeData, HomeData, HomeMockType } from "../api/homeApi";
import SplashScreen from "./SplashScreen";

// 하단 탭 (아이콘 파일 전달 전까지 시스템 심볼 사용)
const TABS: { label: string; icon: SymbolViewProps["name"] }[] = [
  { label: "홈", icon: { ios: "house", android: "home", web: "home" } },
  { label: "탐험", icon: { ios: "safari", android: "explore", web: "explore" } },
  { label: "내 기록", icon: { ios: "person", android: "person", web: "person" } },
];

export default function HomeScreen() {
  const [mockType, setMockType] = useState<HomeMockType>("VOTING");
  const [homeData, setHomeData] = useState<HomeData | null>(null);

  // API 데이터 호출
  useEffect(() => {
    let ignore = false; // 늦게 도착한 이전 응답이 덮어쓰지 않도록
    fetchHomeData(mockType).then((res) => {
      if (!ignore && res.success) setHomeData(res.data);
    });
    return () => {
      ignore = true;
    };
  }, [mockType]);

  const activeRoom = homeData?.active_room;
  const isVoting = activeRoom?.room_status === "VOTING";

  // 히어로 배너 내 게이지 바 계산
  const totalBarCount = isVoting
    ? (activeRoom?.participant_count ?? 1)
    : (activeRoom?.total_quest_count ?? 1);

  const filledBarCount = isVoting
    ? (activeRoom?.voted_participant_count ?? 0)
    : (activeRoom?.completed_quest_count ?? 0);

  // 첫 데이터 로딩 중에는 스플래시 (상태에 맞는 02 / 02-1 / 02-2 화면을 바로 보여주기 위해)
  if (!homeData) return <SplashScreen />;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      <View style={styles.mobileWrapper}>
        {/* 상단 테스트용 전환 탭 */}
        <View style={styles.testBar}>
          {(["EMPTY", "ACTIVE", "VOTING"] as HomeMockType[]).map((type) => (
            <TouchableOpacity
              key={type}
              onPress={() => setMockType(type)}
              style={[
                styles.testBtn,
                mockType === type && styles.testBtnActive,
              ]}
            >
              <Text style={styles.testBtnText}>
                {type === "EMPTY"
                  ? "탐험없음"
                  : type === "ACTIVE"
                    ? "탐험중"
                    : "투표중"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* 헤더 (32x32 로고) */}
          <View style={styles.header}>
            <View style={styles.logoRow}>
              <TouchableOpacity activeOpacity={0.8}>
                <Image
                  source={require("../../assets/images/Logo.png")}
                  style={styles.headerLogo}
                  resizeMode="contain"
                />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>먹으러GO</Text>
            </View>
            <Text style={styles.greetingText}>
              오늘 친구들과 어디로 먹으러 갈까요?
            </Text>
          </View>

          {/* 히어로 배너 */}
          {!activeRoom ? (
            <TouchableOpacity
              style={[styles.heroBanner, styles.heroBannerEmpty]}
              activeOpacity={0.9}
            >
              <Text style={styles.heroEmptyText}>
                진행 중인 탐험이 없어요{"\n"}친구들과 탐험을 시작해보세요
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.heroBanner}>
              <View style={styles.heroBadge}>
                <Text style={styles.heroBadgeText}>
                  {isVoting ? "투표 진행 중" : "진행 중인 탐험"}
                </Text>
              </View>
              <Text style={styles.heroRegionTitle}>
                {activeRoom.region_name} 탐험
              </Text>
              <Text style={styles.heroSubText}>
                {isVoting
                  ? `친구 ${activeRoom.participant_count}명 · 투표 완료 ${activeRoom.voted_participant_count}/${activeRoom.participant_count}`
                  : `퀘스트 ${activeRoom.completed_quest_count}/${activeRoom.total_quest_count} 완료`}
              </Text>

              {/* 유연한 n등분 게이지 바 */}
              <View style={styles.progressBar}>
                {Array.from({ length: totalBarCount }).map((_, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.progressSegment,
                      idx < filledBarCount
                        ? styles.progressFill
                        : styles.progressEmpty,
                    ]}
                  />
                ))}
              </View>

              <TouchableOpacity style={styles.heroButton} activeOpacity={0.8}>
                <Text style={styles.heroButtonText}>
                  {isVoting ? "투표 현황 보기" : "이어하기"}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* 새로운 탐험 시작 카드 (화살표만 클릭) */}
          <View style={styles.newExpCard}>
            <View>
              <Text style={styles.newExpTitle}>새로운 탐험 시작</Text>
              <Text style={styles.newExpSub}>
                지역을 고르고 퀘스트를 함께 선택해요
              </Text>
            </View>
            <TouchableOpacity
              style={styles.arrowCircle}
              activeOpacity={0.8}
              onPress={() => router.push("/condition")}
            >
              <Text style={styles.arrowText}>→</Text>
            </TouchableOpacity>
          </View>

          {/* 하단 리스트: 인기 탐험 지역 or 최근 탐험 */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>
              {!activeRoom ? "인기 탐험 지역" : "최근 탐험"}
            </Text>

            {!activeRoom ? (
              <View style={styles.popularRow}>
                {homeData?.popular_regions.map((region) => (
                  <TouchableOpacity
                    key={region.region_id}
                    style={styles.popularItem}
                    activeOpacity={0.7}
                    onPress={() =>
                      router.push({
                        pathname: "/condition",
                        params: {
                          regionId: String(region.region_id),
                          regionName: region.region_name,
                        },
                      })
                    }
                  >
                    {/* 지역 이미지는 API 필드 추가 후 연결 */}
                    <View style={styles.popularCircle} />
                    <Text style={styles.popularText}>{region.region_name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.recentRow}>
                {homeData?.recent_records.map((record) => (
                  <TouchableOpacity
                    key={record.record_id}
                    style={styles.recentCard}
                    activeOpacity={0.8}
                  >
                    {/* 썸네일은 API 필드 추가 후 연결 */}
                    <View style={styles.recentImageDummy} />
                    <View style={styles.recentBadge}>
                      <Text style={styles.recentBadgeText}>
                        {record.region_name}
                      </Text>
                    </View>
                    <Text style={styles.recentTitle}>
                      {record.region_name} 탐험
                    </Text>
                    <Text style={styles.recentDate}>{record.created_at}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </ScrollView>

        {/* 하단 알약 탭바 */}
        <View style={styles.bottomTabBar}>
          {TABS.map((tab, idx) => {
            const isActive = idx === 0;
            const color = isActive ? COLORS.primary : COLORS.textMain;
            return (
              <TouchableOpacity
                key={tab.label}
                style={[styles.tabItem, isActive && styles.tabItemActive]}
                activeOpacity={0.7}
              >
                <SymbolView
                  name={tab.icon}
                  size={moderateScale(24)}
                  tintColor={color}
                />
                <Text
                  style={[styles.tabText, { color }, isActive && styles.tabTextActive]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
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
    position: "relative",
  },
  scrollContent: { paddingBottom: verticalScale(120) },

  testBar: {
    flexDirection: "row",
    justifyContent: "center",
    backgroundColor: "#eee",
    padding: scale(4),
  },
  testBtn: {
    marginHorizontal: scale(4),
    paddingVertical: scale(6),
    paddingHorizontal: scale(10),
    borderRadius: scale(4),
  },
  testBtnActive: { backgroundColor: "#ccc" },
  testBtnText: { fontSize: moderateScale(11), fontWeight: "bold" },

  header: {
    paddingHorizontal: scale(20),
    paddingTop: verticalScale(10),
    paddingBottom: verticalScale(16),
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: verticalScale(14),
  },
  headerLogo: { width: scale(32), height: scale(32), marginRight: scale(10) },
  headerTitle: {
    fontSize: moderateScale(24),
    fontWeight: "bold",
    color: COLORS.textMain,
  },
  greetingText: { fontSize: moderateScale(15), color: COLORS.textSub },

  heroBanner: {
    width: "100%",
    height: verticalScale(215),
    backgroundColor: COLORS.primary,
    paddingHorizontal: scale(22),
    paddingVertical: verticalScale(20),
    justifyContent: "center",
  },
  heroBannerEmpty: { paddingHorizontal: scale(30) },
  heroEmptyText: {
    fontSize: moderateScale(20),
    fontWeight: "bold",
    color: COLORS.background,
    lineHeight: moderateScale(28),
  },
  heroBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.2)",
    height: verticalScale(23),
    paddingHorizontal: scale(11),
    borderRadius: scale(12),
    justifyContent: "center",
    marginBottom: verticalScale(10),
  },
  heroBadgeText: {
    color: COLORS.background,
    fontSize: moderateScale(12),
    fontWeight: "bold",
  },
  heroRegionTitle: {
    fontSize: moderateScale(28),
    fontWeight: "bold",
    color: COLORS.background,
    marginBottom: verticalScale(8),
  },
  heroSubText: {
    fontSize: moderateScale(15),
    color: COLORS.background,
    marginBottom: verticalScale(14),
  },

  progressBar: {
    flexDirection: "row",
    gap: scale(6),
    marginBottom: verticalScale(16),
  },
  progressSegment: {
    flex: 1,
    height: verticalScale(6),
    borderRadius: scale(3),
  },
  progressFill: { backgroundColor: COLORS.background },
  progressEmpty: { backgroundColor: "rgba(255,255,255,0.3)" },

  heroButton: {
    width: "100%",
    height: verticalScale(45),
    backgroundColor: COLORS.background,
    borderRadius: scale(18),
    justifyContent: "center",
    alignItems: "center",
  },
  heroButtonText: {
    color: COLORS.primary,
    fontWeight: "bold",
    fontSize: moderateScale(16),
  },

  newExpCard: {
    width: scale(353),
    height: verticalScale(78),
    backgroundColor: COLORS.cardBg,
    borderRadius: scale(28),
    alignSelf: "center",
    marginTop: verticalScale(14),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingLeft: scale(20),
    paddingRight: scale(16),
  },
  newExpTitle: {
    fontSize: moderateScale(17),
    fontWeight: "bold",
    color: COLORS.textMain,
    marginBottom: verticalScale(4),
  },
  newExpSub: { fontSize: moderateScale(12), color: COLORS.textSub },
  arrowCircle: {
    width: scale(44),
    height: scale(44),
    borderRadius: scale(22),
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  arrowText: {
    color: COLORS.background,
    fontSize: moderateScale(18),
    fontWeight: "bold",
  },

  sectionContainer: {
    marginTop: verticalScale(40),
    paddingHorizontal: scale(20),
  },
  sectionTitle: {
    fontSize: moderateScale(20),
    fontWeight: "bold",
    color: COLORS.textMain,
    marginBottom: verticalScale(14),
  },

  popularRow: { flexDirection: "row", justifyContent: "space-evenly" },
  popularItem: { alignItems: "center" },
  popularCircle: {
    width: scale(65),
    height: scale(65),
    borderRadius: scale(32.5),
    backgroundColor: "#ddd",
    marginBottom: verticalScale(8),
  },
  popularText: {
    fontSize: moderateScale(13),
    color: COLORS.textMain,
    fontWeight: "500",
  },

  recentRow: { flexDirection: "row", gap: scale(10) },
  recentCard: { flex: 1 },
  recentImageDummy: {
    width: "100%",
    height: verticalScale(130),
    backgroundColor: "#ddd",
    borderRadius: scale(8),
    marginBottom: verticalScale(4),
  },
  recentBadge: {
    alignSelf: "flex-start",
    height: verticalScale(24),
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.chipBorder,
    paddingHorizontal: scale(10),
    borderRadius: scale(12),
    marginLeft: scale(4),
    marginBottom: verticalScale(8),
  },
  recentBadgeText: { fontSize: moderateScale(12), color: COLORS.primary },
  recentTitle: {
    fontSize: moderateScale(16),
    fontWeight: "500",
    color: COLORS.textMain,
    marginLeft: scale(5),
    marginBottom: verticalScale(2),
  },
  recentDate: {
    fontSize: moderateScale(14),
    fontWeight: "bold",
    color: COLORS.textSub,
    marginLeft: scale(5),
  },

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
