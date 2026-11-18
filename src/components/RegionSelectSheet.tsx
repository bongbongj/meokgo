// src/components/RegionSelectSheet.tsx

import React, { useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Platform,
} from "react-native";
import Icon from "./common/Icon";
import PhotoImage from "./common/PhotoImage";
import { COLORS } from "../constants/colors";
import { scale, verticalScale, moderateScale } from "../utils/responsive";
import {
  fetchRecentRegions,
  fetchRegions,
  RecentRegion,
  Region,
} from "../api/regionApi";

export interface SelectedRegion {
  region_id: number;
  region_name: string;
  region_image_url?: string | null; // 지역 대표 이미지 (조건 선택 화면의 사진 카드)
}

/**
 * 04. 탐험 지역 선택 바텀시트
 * - 검색, 최근 선택 지역, 시/도 카테고리 탭, 세부 지역 2열 목록
 * - 상위 지역(시/도)이 없는 지역 데이터면 카테고리 탭 없이 전체 지역을 목록으로 표시
 * - 지역은 1개만 선택, 선택 즉시 조건 선택 화면으로 복귀
 */
export default function RegionSelectSheet({
  visible,
  selected,
  onSelect,
  onClose,
}: {
  visible: boolean;
  selected: SelectedRegion | null;
  onSelect: (region: SelectedRegion) => void;
  onClose: () => void;
}) {
  const [keyword, setKeyword] = useState("");
  const [regions, setRegions] = useState<Region[]>([]); // 전체 지역
  const [searchResults, setSearchResults] = useState<Region[]>([]);
  const [recentRegions, setRecentRegions] = useState<RecentRegion[]>([]);
  const [openCityId, setOpenCityId] = useState<number | null>(null);

  // 시트가 열릴 때 전체 지역·최근 지역 조회
  useEffect(() => {
    if (!visible) return;
    let ignore = false;
    fetchRegions({})
      .then((res) => {
        if (ignore) return;
        setRegions(res.data.regions);
      })
      .catch(() => {});
    fetchRecentRegions()
      .then((res) => {
        if (!ignore) setRecentRegions(res.data.recent_regions);
      })
      .catch(() => {});
    return () => {
      ignore = true;
    };
  }, [visible]);

  // 검색어가 있으면 서버에서 이름 검색
  useEffect(() => {
    if (!visible || !keyword.trim()) return;
    let ignore = false;
    fetchRegions({ keyword })
      .then((res) => {
        if (!ignore) setSearchResults(res.data.regions);
      })
      .catch(() => {});
    return () => {
      ignore = true;
    };
  }, [visible, keyword]);

  const handleSelect = (region: SelectedRegion) => {
    onSelect(region);
    setKeyword("");
    onClose();
  };

  const isSearching = keyword.trim().length > 0;

  // 하위 지역이 하나라도 있으면 상위 지역을 카테고리 탭으로, 없으면 전체를 바로 목록으로 표시
  const parentIds = new Set(regions.map((r) => r.parent_region_id));
  const isCategory = (region: Region) => parentIds.has(region.region_id);
  const cities = regions.filter(isCategory);
  const activeCityId = openCityId ?? cities[0]?.region_id ?? null;
  const districts = isSearching
    ? searchResults.filter((r) => !isCategory(r))
    : cities.length > 0
      ? regions.filter((r) => r.parent_region_id === activeCityId)
      : regions;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.inner}>
            <Text style={styles.title}>탐험 지역 선택</Text>

            {/* 지역 검색 */}
            <View style={styles.searchField}>
              <Icon name="search" size={moderateScale(19)} color={COLORS.textMuted} />
              <TextInput
                style={styles.searchInput}
                placeholder="지역 검색"
                placeholderTextColor={COLORS.textMuted}
                value={keyword}
                onChangeText={setKeyword}
                returnKeyType="search"
              />
            </View>

            {/* 최근 선택 지역 */}
            {!isSearching && recentRegions.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>최근 선택 지역</Text>
                <View style={styles.recentRow}>
                  {recentRegions.map((region) => (
                    <TouchableOpacity
                      key={region.region_id}
                      style={styles.recentItem}
                      activeOpacity={0.7}
                      onPress={() => handleSelect(region)}
                    >
                      {/* 지역 대표 이미지 (없으면 회색 기본 원) */}
                      {region.region_image_url ? (
                        <PhotoImage
                          url={region.region_image_url}
                          style={styles.recentCircle}
                        />
                      ) : (
                        <View style={styles.recentCircle} />
                      )}
                      <Text style={styles.recentText}>{region.region_name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
          </View>

          {/* 시/도 카테고리 탭 (3열) */}
          {!isSearching && cities.length > 0 && (
            <View style={styles.cityGrid}>
              {cities.map((city) => {
                const isOpen = city.region_id === activeCityId;
                return (
                  <TouchableOpacity
                    key={city.region_id}
                    style={[styles.cityCell, isOpen && styles.cityCellOpen]}
                    activeOpacity={0.7}
                    onPress={() => setOpenCityId(city.region_id)}
                  >
                    <Text style={[styles.cityText, isOpen && styles.cityTextOpen]}>
                      {city.region_name}
                    </Text>
                    <Icon
                      name={isOpen ? "chevronUp" : "chevronDown"}
                      size={moderateScale(16)}
                      color={isOpen ? COLORS.primary : COLORS.textMuted}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* 세부 지역 2열 목록 */}
          <View style={styles.districtList}>
            {districts.map((district) => {
              const isSelected = district.region_id === selected?.region_id;
              return (
                <TouchableOpacity
                  key={district.region_id}
                  style={styles.districtCell}
                  activeOpacity={0.7}
                  onPress={() => handleSelect(district)}
                >
                  <View style={styles.districtNameRow}>
                    <Text
                      style={[
                        styles.districtText,
                        isSelected && styles.districtTextSelected,
                      ]}
                      numberOfLines={1}
                    >
                      {district.region_name}
                    </Text>
                    {isSelected && (
                      <View style={styles.checkCircle}>
                        <Icon name="check" size={moderateScale(12)} color={COLORS.background} />
                      </View>
                    )}
                  </View>
                  <Icon name="chevronRight" size={moderateScale(16)} color={COLORS.textMuted} />
                </TouchableOpacity>
              );
            })}
            {isSearching && districts.length === 0 && (
              <Text style={styles.emptyText}>검색 결과가 없어요</Text>
            )}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.3)" },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    // 화면이 넓어도 좌우를 꽉 채운다 (높이는 그대로 77%)
    height: "77%",
    backgroundColor: COLORS.background,
    borderTopLeftRadius: scale(28),
    borderTopRightRadius: scale(28),
    overflow: "hidden",
  },
  // 시트는 좌우를 꽉 채우고, 안쪽 내용은 디자인 너비(393)로 가운데 모은다
  // scale(393): 웹은 393으로 고정, 휴대폰은 화면 너비 — 안쪽 크기(scale 기준)와 맞춘다
  content: {
    width: "100%",
    maxWidth: scale(393),
    alignSelf: "center",
  },
  inner: {
    paddingHorizontal: scale(30),
    paddingTop: verticalScale(28),
  },
  title: {
    fontSize: moderateScale(18),
    fontWeight: "bold",
    color: COLORS.textMain,
    marginBottom: verticalScale(16),
  },
  searchField: {
    height: verticalScale(46),
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.background,
    borderRadius: scale(14),
    paddingHorizontal: scale(14),
    gap: scale(10),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: verticalScale(24),
  },
  searchInput: {
    flex: 1,
    height: "100%",
    fontSize: moderateScale(15),
    color: COLORS.textMain,
    paddingVertical: 0,
    ...(Platform.OS === "web" ? ({ outlineStyle: "none" } as any) : {}),
  },
  sectionTitle: {
    fontSize: moderateScale(16),
    fontWeight: "bold",
    color: COLORS.textMain,
    marginBottom: verticalScale(12),
  },
  recentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: verticalScale(24),
  },
  recentItem: { alignItems: "center" },
  recentCircle: {
    width: scale(65),
    height: scale(65),
    borderRadius: scale(32.5),
    backgroundColor: "#ddd",
    marginBottom: verticalScale(8),
  },
  recentText: { fontSize: moderateScale(13), color: COLORS.textMain },

  cityGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    borderTopWidth: 1,
    borderColor: COLORS.divider,
  },
  cityCell: {
    width: "33.333%",
    height: verticalScale(48),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: scale(16),
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.divider,
  },
  cityCellOpen: { backgroundColor: COLORS.coralTint },
  cityText: { fontSize: moderateScale(15), color: COLORS.textMain },
  cityTextOpen: { color: COLORS.primary, fontWeight: "bold" },

  districtList: {
    flexDirection: "row",
    flexWrap: "wrap",
    backgroundColor: COLORS.cardBg,
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(4),
    minHeight: verticalScale(200),
  },
  districtCell: {
    width: "50%",
    height: verticalScale(48),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: scale(8),
  },
  districtNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
    flexShrink: 1,
  },
  districtText: { fontSize: moderateScale(15), color: COLORS.textMain },
  districtTextSelected: { color: COLORS.primary, fontWeight: "bold" },
  checkCircle: {
    width: scale(20),
    height: scale(20),
    borderRadius: scale(10),
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    width: "100%",
    textAlign: "center",
    marginTop: verticalScale(24),
    fontSize: moderateScale(14),
    color: COLORS.textMuted,
  },
});
