// src/screens/HomeScreen.tsx

import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
} from "react-native";
import { COLORS } from "../constants/colors";
import { scale, verticalScale, moderateScale } from "../utils/responsive";
import { fetchHomeData, HomeData, HomeMockType } from "../api/homeApi";

export default function HomeScreen() {
  const [mockType, setMockType] = useState<HomeMockType>("VOTING");
  const [homeData, setHomeData] = useState<HomeData | null>(null);

  // API 데이터 호출
  useEffect(() => {
    fetchHomeData(mockType).then((res) => {
      if (res.success) setHomeData(res.data);
    });
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

  return (
    <SafeAreaView style={styles.container}>
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
          {/* 헤더 (40x40 로고) */}
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
            <TouchableOpacity style={styles.heroBanner} activeOpacity={0.9}>
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
            <TouchableOpacity style={styles.arrowCircle} activeOpacity={0.8}>
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
                  >
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
          <TouchableOpacity style={styles.tabItem} activeOpacity={0.7}>
            <Text style={[styles.tabText, styles.tabActive]}>홈</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tabItem} activeOpacity={0.7}>
            <Text style={styles.tabText}>탐험</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tabItem} activeOpacity={0.7}>
            <Text style={styles.tabText}>내 기록</Text>
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
    position: "relative",
  },
  scrollContent: { paddingBottom: verticalScale(100) },

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
    paddingTop: verticalScale(16),
    paddingBottom: verticalScale(16),
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: verticalScale(8),
  },
  headerLogo: { width: scale(40), height: scale(40), marginRight: scale(8) },
  headerTitle: {
    fontSize: moderateScale(24),
    fontWeight: "bold",
    color: COLORS.textMain,
  },
  greetingText: { fontSize: moderateScale(13), color: COLORS.textSub },

  heroBanner: {
    width: "100%",
    height: verticalScale(215),
    backgroundColor: COLORS.primary,
    padding: scale(20),
    justifyContent: "center",
  },
  heroEmptyText: {
    fontSize: moderateScale(24),
    fontWeight: "bold",
    color: COLORS.background,
    lineHeight: moderateScale(32),
  },
  heroBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(4),
    borderRadius: scale(12),
    marginBottom: verticalScale(12),
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
    fontSize: moderateScale(13),
    color: COLORS.background,
    marginBottom: verticalScale(16),
  },

  progressBar: {
    flexDirection: "row",
    gap: scale(8),
    marginBottom: verticalScale(20),
  },
  progressSegment: {
    flex: 1,
    height: verticalScale(4),
    borderRadius: scale(2),
  },
  progressFill: { backgroundColor: COLORS.background },
  progressEmpty: { backgroundColor: "rgba(255,255,255,0.3)" },

  heroButton: {
    width: "100%",
    height: verticalScale(45),
    backgroundColor: COLORS.background,
    borderRadius: scale(14),
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
    marginTop: verticalScale(20),
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
    marginTop: verticalScale(32),
    paddingHorizontal: scale(20),
  },
  sectionTitle: {
    fontSize: moderateScale(18),
    fontWeight: "bold",
    color: COLORS.textMain,
    marginBottom: verticalScale(16),
  },

  popularRow: { flexDirection: "row", justifyContent: "space-between" },
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

  recentRow: { flexDirection: "row", justifyContent: "space-between" },
  recentCard: { width: scale(171.5), height: verticalScale(219) },
  recentImageDummy: {
    width: "100%",
    height: verticalScale(120),
    backgroundColor: "#ddd",
    borderRadius: scale(12),
    marginBottom: verticalScale(12),
  },
  recentBadge: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: COLORS.primary,
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(2),
    borderRadius: scale(10),
    marginBottom: verticalScale(8),
  },
  recentBadgeText: { fontSize: moderateScale(11), color: COLORS.primary },
  recentTitle: {
    fontSize: moderateScale(15),
    fontWeight: "bold",
    color: COLORS.textMain,
    marginBottom: verticalScale(4),
  },
  recentDate: { fontSize: moderateScale(12), color: COLORS.textSub },

  bottomTabBar: {
    position: "absolute",
    bottom: verticalScale(30),
    width: scale(294),
    height: verticalScale(54),
    backgroundColor: COLORS.background,
    borderRadius: scale(27),
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: scale(8),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  tabItem: { flex: 1, alignItems: "center", justifyContent: "center" },
  tabText: {
    fontSize: moderateScale(12),
    color: COLORS.textSub,
    marginTop: verticalScale(4),
  },
  tabActive: { color: COLORS.primary, fontWeight: "bold" },
});
