// src/components/RegionSelectSheet.tsx

import React, { useEffect, useState } from "react";
import {
  Image,
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
import { SymbolView } from "expo-symbols";
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
}

/**
 * 04. 탐험 지역 선택 바텀시트
 * - 검색, 최근 선택 지역, 시/도 카테고리 탭, 세부 지역 2열 목록
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
  const [cities, setCities] = useState<Region[]>([]);
  const [recentRegions, setRecentRegions] = useState<RecentRegion[]>([]);
  const [openCityId, setOpenCityId] = useState<number | null>(null);
  const [districts, setDistricts] = useState<Region[]>([]);

  // 시트가 열릴 때 카테고리·최근 지역 조회
  useEffect(() => {
    if (!visible) return;
    let ignore = false;
    fetchRegions({}).then((res) => {
      if (ignore) return;
      setCities(res.data.regions);
      setOpenCityId((prev) => prev ?? res.data.regions[0]?.region_id ?? null);
    });
    fetchRecentRegions().then((res) => {
      if (!ignore) setRecentRegions(res.data.recent_regions);
    });
    return () => {
      ignore = true;
    };
  }, [visible]);

  // 검색어가 있으면 검색 결과, 없으면 펼친 카테고리의 하위 지역
  useEffect(() => {
    if (!visible) return;
    let ignore = false;
    const params = keyword.trim()
      ? { keyword }
      : openCityId
        ? { parent_region_id: openCityId }
        : null;
    if (!params) return;
    fetchRegions(params).then((res) => {
      if (!ignore) setDistricts(res.data.regions);
    });
    return () => {
      ignore = true;
    };
  }, [visible, keyword, openCityId]);

  const handleSelect = (region: SelectedRegion) => {
    onSelect(region);
    setKeyword("");
    onClose();
  };

  const isSearching = keyword.trim().length > 0;

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
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.inner}>
            <Text style={styles.title}>탐험 지역 선택</Text>

            {/* 지역 검색 */}
            <View style={styles.searchField}>
              <SymbolView
                name={{ ios: "magnifyingglass", android: "search", web: "search" }}
                size={moderateScale(22)}
                tintColor={COLORS.textMuted}
              />
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
                        <Image
                          source={{ uri: region.region_image_url }}
                          style={styles.recentCircle}
                          resizeMode="cover"
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
          {!isSearching && (
            <View style={styles.cityGrid}>
              {cities.map((city) => {
                const isOpen = city.region_id === openCityId;
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
                    <SymbolView
                      name={
                        isOpen
                          ? { ios: "chevron.up", android: "keyboard_arrow_up", web: "keyboard_arrow_up" }
                          : { ios: "chevron.down", android: "keyboard_arrow_down", web: "keyboard_arrow_down" }
                      }
                      size={moderateScale(18)}
                      tintColor={isOpen ? COLORS.primary : COLORS.textMuted}
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
                        <SymbolView
                          name={{ ios: "checkmark", android: "check", web: "check" }}
                          size={moderateScale(14)}
                          tintColor={COLORS.background}
                        />
                      </View>
                    )}
                  </View>
                  <SymbolView
                    name={{ ios: "chevron.right", android: "chevron_right", web: "chevron_right" }}
                    size={moderateScale(18)}
                    tintColor={COLORS.textMuted}
                  />
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
    height: "77%",
    maxWidth: 393,
    width: "100%",
    alignSelf: "center",
    backgroundColor: COLORS.background,
    borderTopLeftRadius: scale(28),
    borderTopRightRadius: scale(28),
    overflow: "hidden",
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
