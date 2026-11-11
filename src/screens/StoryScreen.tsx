// src/screens/StoryScreen.tsx
// 16. 스토리 템플릿 선택
// - 템플릿 선택: 01 MOOD / 02 콜라주 (선택한 템플릿 이름을 코랄로 강조), 썸네일은 고른 사진으로 바로 갱신
// - 사진 선택: 지역 / 음식 / 함께한 / 추가 사진 4칸. 처음에는 기록 사진으로 채움
//   칸을 누르면 갤러리에서 교체, X로 비우기. JPG / PNG, 장당 10MB 이하
// - 최소 1장 — 0장이면 미리보기 비활성. 빈 칸은 템플릿에서 제외
// - 미리보기: 새로 고른 사진만 업로드(POST /records/{id}/photos) → 선택 상태 저장 → 17 기록 미리보기

import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SymbolView } from "expo-symbols";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { COLORS } from "../constants/colors";
import { moderateScale, scale, verticalScale } from "../utils/responsive";
import { formatDotDate } from "../utils/date";
import { saveStoryDraft } from "../utils/storyDraft";
import { isApiError } from "../api/client";
import { fetchRecordDetail, RecordDetail, RecordPhoto } from "../api/recordApi";
import PhotoImage from "../components/common/PhotoImage";
import {
  fetchStoryTemplates,
  LocalPhoto,
  STORY_MAX_PHOTOS,
  STORY_PHOTO_MAX_BYTES,
  STORY_PHOTO_TYPES,
  StoryTemplate,
  uploadRecordPhotos,
} from "../api/storyApi";
import { LogoHeader } from "../components/ScreenHeader";
import PrimaryButton from "../components/common/PrimaryButton";
import { useToast } from "../components/Toast";
import StoryCard, { getStoryLayout } from "../components/story/StoryCard";

interface StoryScreenProps {
  recordId: number;
}

const SLOT_LABELS = ["지역 사진", "음식 사진", "함께한 사진", "추가 사진"];

/** 사진 칸 — 이미 서버에 있는 사진(photo_id) 또는 새로 고른 기기 사진(local) */
type Slot = { photo_url: string; photo_id?: number; local?: LocalPhoto } | null;

// 2열 칸 너비 — mobileWrapper(최대 393) 안에서 계산. scale()은 기기 전체 너비 기준이라
// 393dp보다 넓은 폰에서 scale(169) 두 칸이 한 줄에 들어가지 않고 줄바꿈됨
const MAX_CONTENT_WIDTH = 393;
const THUMB_RATIO = 226 / 169; // 디자인 썸네일 169 x 226
const GRID_PADDING = 20;
const GRID_GAP = 13;

const toTemplateLabel = (template: StoryTemplate, index: number) =>
  `${String(index + 1).padStart(2, "0")} ${template.template_name}`;

export default function StoryScreen({ recordId }: StoryScreenProps) {
  const [record, setRecord] = useState<RecordDetail | null>(null);
  const [templates, setTemplates] = useState<StoryTemplate[] | null>(null);
  const [templateId, setTemplateId] = useState<number | null>(null);
  const [slots, setSlots] = useState<Slot[]>(() => Array(STORY_MAX_PHOTOS).fill(null));
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [uploading, setUploading] = useState(false);
  const { showToast, toast } = useToast();
  const { width: windowWidth } = useWindowDimensions();
  const cellWidth =
    (Math.min(windowWidth, MAX_CONTENT_WIDTH) - GRID_PADDING * 2 - GRID_GAP) / 2;
  const thumbHeight = cellWidth * THUMB_RATIO;

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchRecordDetail(recordId), fetchStoryTemplates()]).then(
      ([detail, list]) => {
        if (cancelled) return;
        setRecord(detail);
        setTemplates(list);
        setTemplateId((current) => current ?? list[0]?.template_id ?? null);
        setSlots((current) =>
          current.some(Boolean)
            ? current
            : Array.from({ length: STORY_MAX_PHOTOS }, (_, i) => detail.photos[i] ?? null),
        );
      },
      (e) => {
        if (!cancelled) setError(isApiError(e) ? e.message : "잠시 후 다시 시도해주세요.");
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

  const setSlot = (index: number, slot: Slot) =>
    setSlots((current) => current.map((s, i) => (i === index ? slot : s)));

  // 갤러리 사진 고르기 (이미지는 권한 요청 없이 열 수 있음 — expo-image-picker 문서)
  const pickPhoto = async (index: number) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.9,
    });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    if (asset.mimeType && !STORY_PHOTO_TYPES.includes(asset.mimeType)) {
      showToast("JPG, PNG 사진만 올릴 수 있어요");
      return;
    }
    if (asset.fileSize && asset.fileSize > STORY_PHOTO_MAX_BYTES) {
      showToast("10MB 이하 사진만 올릴 수 있어요");
      return;
    }
    setSlot(index, {
      photo_url: asset.uri,
      local: { uri: asset.uri, fileName: asset.fileName, mimeType: asset.mimeType },
    });
  };

  const filled = slots.filter((slot): slot is NonNullable<Slot> => slot !== null);

  const handlePreview = async () => {
    if (!templateId || filled.length === 0 || uploading) return;
    setUploading(true);
    try {
      const locals = filled.filter((slot) => slot.local);
      const uploaded = locals.length
        ? (await uploadRecordPhotos(recordId, locals.map((slot) => slot.local!))).photos
        : [];
      // 업로드 결과를 고른 순서대로 다시 끼워 넣는다
      let next = 0;
      const photos: RecordPhoto[] = filled.map((slot) =>
        slot.local ? uploaded[next++] : { photo_id: slot.photo_id!, photo_url: slot.photo_url },
      );
      saveStoryDraft(recordId, { template_id: templateId, photos });
      router.push(`/records/${recordId}/preview`);
    } catch (e) {
      showToast(isApiError(e) ? e.message : "사진을 올리지 못했어요. 다시 시도해주세요");
    } finally {
      setUploading(false);
    }
  };

  const photoUrls = filled.map((slot) => slot.photo_url);

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.mobileWrapper}>
        {record && templates ? (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <LogoHeader title="기록 남기기" />

            <Text style={styles.sectionTitle}>템플릿 선택</Text>
            <View style={styles.grid}>
              {templates.map((template, index) => {
                const selected = template.template_id === templateId;
                return (
                  <TouchableOpacity
                    key={template.template_id}
                    style={{ width: cellWidth }}
                    activeOpacity={0.85}
                    onPress={() => setTemplateId(template.template_id)}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: selected }}
                    accessibilityLabel={toTemplateLabel(template, index)}
                  >
                    <View style={[styles.thumb, selected && styles.thumbSelected]}>
                      {photoUrls.length > 0 ? (
                        <StoryCard
                          layout={getStoryLayout(template.template_id)}
                          photoUrls={photoUrls}
                          regionName={record.region_name}
                          dateText={formatDotDate(record.created_at)}
                          questCount={record.completed_quests.filter((q) => q.completed).length}
                          width={cellWidth}
                          height={thumbHeight}
                        />
                      ) : (
                        <View style={[styles.thumbEmpty, { width: cellWidth, height: thumbHeight }]} />
                      )}
                    </View>
                    <Text style={[styles.templateName, selected && styles.templateNameSelected]}>
                      {toTemplateLabel(template, index)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.sectionTitle}>사진 선택</Text>
            <View style={styles.grid}>
              {slots.map((slot, index) => (
                <View key={SLOT_LABELS[index]} style={{ width: cellWidth }}>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => pickPhoto(index)}
                    accessibilityRole="button"
                    accessibilityLabel={`${SLOT_LABELS[index]} ${slot ? "바꾸기" : "추가"}`}
                  >
                    {slot ? (
                      <PhotoImage url={slot.photo_url} style={styles.slot} />
                    ) : (
                      <View style={[styles.slot, styles.slotEmpty]}>
                        <SymbolView
                          name={{ ios: "plus", android: "add", web: "add" }}
                          size={moderateScale(26)}
                          tintColor={COLORS.textMuted}
                        />
                      </View>
                    )}
                  </TouchableOpacity>
                  {slot && (
                    <TouchableOpacity
                      style={styles.remove}
                      onPress={() => setSlot(index, null)}
                      hitSlop={8}
                      accessibilityRole="button"
                      accessibilityLabel={`${SLOT_LABELS[index]} 비우기`}
                    >
                      <SymbolView
                        name={{ ios: "xmark", android: "close", web: "close" }}
                        size={moderateScale(12)}
                        tintColor={COLORS.background}
                      />
                    </TouchableOpacity>
                  )}
                  <Text style={styles.slotLabel}>{SLOT_LABELS[index]}</Text>
                </View>
              ))}
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

        <View style={styles.footer}>
          <PrimaryButton
            label="미리보기"
            onPress={handlePreview}
            disabled={!templateId || filled.length === 0}
            loading={uploading}
          />
          {record && filled.length === 0 && (
            <Text style={styles.caption}>사진을 1장 이상 골라주세요</Text>
          )}
        </View>
        {toast}
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
  scrollContent: { paddingBottom: verticalScale(16) },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  sectionTitle: {
    fontSize: moderateScale(17),
    fontWeight: "bold",
    color: COLORS.textMain,
    paddingHorizontal: scale(20),
    marginTop: verticalScale(4),
    marginBottom: verticalScale(14),
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: GRID_PADDING,
    columnGap: GRID_GAP,
    rowGap: verticalScale(10),
    marginBottom: verticalScale(22),
  },

  thumb: {
    borderRadius: scale(12),
    backgroundColor: COLORS.background,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  thumbSelected: {
    shadowOpacity: 0.18,
    elevation: 6,
  },
  thumbEmpty: {
    borderRadius: scale(12),
    backgroundColor: COLORS.cardBg,
  },
  templateName: {
    marginTop: verticalScale(10),
    textAlign: "center",
    fontSize: moderateScale(13),
    color: COLORS.textSub,
  },
  templateNameSelected: { color: COLORS.primary, fontWeight: "bold" },

  slot: {
    width: "100%",
    height: verticalScale(100),
    borderRadius: scale(6),
  },
  slotEmpty: {
    backgroundColor: COLORS.cardBg,
    justifyContent: "center",
    alignItems: "center",
  },
  remove: {
    position: "absolute",
    top: scale(6),
    right: scale(6),
    width: scale(22),
    height: scale(22),
    borderRadius: scale(11),
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    justifyContent: "center",
    alignItems: "center",
  },
  slotLabel: {
    marginTop: verticalScale(6),
    textAlign: "center",
    fontSize: moderateScale(13),
    color: COLORS.textSub,
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

  footer: {
    paddingHorizontal: scale(20),
    paddingTop: verticalScale(8),
    paddingBottom: verticalScale(16),
  },
  caption: {
    marginTop: verticalScale(8),
    fontSize: moderateScale(12),
    color: COLORS.textMuted,
    textAlign: "center",
  },
});
