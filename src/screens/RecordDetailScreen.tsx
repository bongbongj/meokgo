// src/screens/RecordDetailScreen.tsx
// 15. 탐험 기록
// - 대표 사진(첫 번째 사진), 지역명 · 날짜 · 대표 참여자 외 N명, 그날의 사진(나머지), 완료한 퀘스트
// - 사진을 누르면 원본 크게 보기 (화면 탭 / 뒤로가기로 닫기)
// - 기록 남기기 → 16 스토리 템플릿 선택 (디자인 시안에 버튼 위치가 없어 목록 아래에 둠 — README 컨펌 필요 사항)
// - 진입: 11 내 기록 카드, 18 탐험 종료의 기록 보러가기, 02 홈 최근 탐험 카드

import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { COLORS } from "../constants/colors";
import { moderateScale, scale, verticalScale } from "../utils/responsive";
import { formatDotDate } from "../utils/date";
import { isApiError } from "../api/client";
import { fetchRecordDetail, getPhotoSource, RecordDetail } from "../api/recordApi";
import { LogoHeader } from "../components/ScreenHeader";
import PrimaryButton from "../components/common/PrimaryButton";
import CheckCircle from "../components/common/CheckCircle";
import BottomTabBar from "../components/BottomTabBar";

interface RecordDetailScreenProps {
  recordId: number;
}

export default function RecordDetailScreen({ recordId }: RecordDetailScreenProps) {
  const [record, setRecord] = useState<RecordDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchRecordDetail(recordId).then(
      (result) => {
        if (!cancelled) setRecord(result);
      },
      (e) => {
        if (cancelled) return;
        if (isApiError(e) && e.code === "RECORD-001") setError("탐험 기록을 찾을 수 없어요.");
        else setError(isApiError(e) ? e.message : "잠시 후 다시 시도해주세요.");
      },
    );
    return () => {
      cancelled = true;
    };
  }, [recordId, reloadKey]);

  const retry = () => {
    setError(null);
    setReloadKey((key) => key + 1);
  };

  const [cover, ...dayPhotos] = record?.photos ?? [];
  const others = (record?.participants.length ?? 0) - 1;
  const people = record
    ? others > 0
      ? `${record.participants[0]} 외 ${others}명`
      : (record.participants[0] ?? "")
    : "";

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.mobileWrapper}>
        {record ? (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <LogoHeader title="탐험 기록" />

            <View style={styles.section}>
              {cover ? (
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => setViewerUrl(cover.photo_url)}
                  accessibilityRole="imagebutton"
                  accessibilityLabel="대표 사진 크게 보기"
                >
                  <Image source={getPhotoSource(cover.photo_url)} style={styles.cover} />
                </TouchableOpacity>
              ) : (
                <View style={[styles.cover, styles.coverEmpty]} />
              )}

              <Text style={styles.region}>{record.region_name} 탐험</Text>
              <Text style={styles.meta}>
                {formatDotDate(record.created_at)}
                {people ? ` · ${people}` : ""}
              </Text>
            </View>

            {dayPhotos.length > 0 && (
              <View style={styles.block}>
                <Text style={[styles.blockTitle, styles.section]}>그날의 사진</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.photoRow}
                >
                  {dayPhotos.map((photo) => (
                    <TouchableOpacity
                      key={photo.photo_id}
                      activeOpacity={0.9}
                      onPress={() => setViewerUrl(photo.photo_url)}
                      accessibilityRole="imagebutton"
                      accessibilityLabel="사진 크게 보기"
                    >
                      <Image source={getPhotoSource(photo.photo_url)} style={styles.photo} />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            <View style={[styles.block, styles.section]}>
              <Text style={styles.blockTitle}>완료한 퀘스트</Text>
              {record.completed_quests
                .filter((quest) => quest.completed)
                .map((quest) => (
                  <View key={quest.quest_title} style={styles.questRow}>
                    <CheckCircle checked size={20} />
                    <Text style={styles.questTitle}>{quest.quest_title}</Text>
                  </View>
                ))}
            </View>

            <View style={[styles.block, styles.section]}>
              <PrimaryButton
                label="기록 남기기"
                onPress={() => router.push(`/records/${record.record_id}/story`)}
              />
            </View>
          </ScrollView>
        ) : error ? (
          <View style={styles.center}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={retry} style={styles.retry}>
              <Text style={styles.retryText}>다시 시도</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.center}>
            <ActivityIndicator color={COLORS.primary} />
          </View>
        )}

        <BottomTabBar active="records" activeNavigable />
      </View>

      {/* 원본 크게 보기 */}
      <Modal
        visible={viewerUrl !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setViewerUrl(null)}
      >
        <Pressable
          style={styles.viewer}
          onPress={() => setViewerUrl(null)}
          accessibilityLabel="사진 닫기"
        >
          {viewerUrl && (
            <Image
              source={getPhotoSource(viewerUrl)}
              style={styles.viewerImage}
              resizeMode="contain"
            />
          )}
        </Pressable>
      </Modal>
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
  scrollContent: { paddingBottom: verticalScale(120) },
  section: { paddingHorizontal: scale(22) },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  cover: {
    width: "100%",
    height: verticalScale(170),
    borderRadius: scale(6),
    marginBottom: verticalScale(20),
  },
  coverEmpty: { backgroundColor: COLORS.cardBg },
  region: {
    fontSize: moderateScale(20),
    fontWeight: "bold",
    color: COLORS.textMain,
    marginBottom: verticalScale(8),
  },
  meta: { fontSize: moderateScale(15), color: COLORS.textSub },

  block: { marginTop: verticalScale(32) },
  blockTitle: {
    fontSize: moderateScale(18),
    fontWeight: "bold",
    color: COLORS.textMain,
    marginBottom: verticalScale(14),
  },
  photoRow: { paddingHorizontal: scale(22), gap: scale(16) },
  photo: {
    width: scale(94),
    height: verticalScale(83),
    borderRadius: scale(4),
  },

  questRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: verticalScale(8),
  },
  questTitle: {
    marginLeft: scale(14),
    fontSize: moderateScale(16),
    color: COLORS.textMain,
  },

  errorText: {
    fontSize: moderateScale(14),
    color: COLORS.textSub,
    textAlign: "center",
  },
  retry: {
    marginTop: verticalScale(12),
    paddingVertical: verticalScale(8),
    paddingHorizontal: scale(16),
  },
  retryText: {
    fontSize: moderateScale(14),
    fontWeight: "bold",
    color: COLORS.primary,
  },

  viewer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.92)",
    justifyContent: "center",
    alignItems: "center",
  },
  viewerImage: { width: "100%", height: "80%" },
});
