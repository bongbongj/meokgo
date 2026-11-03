// src/screens/StoryPreviewScreen.tsx
// 17. 기록 미리보기
// - 16에서 고른 템플릿 · 사진으로 9:16 기록 이미지를 그린다 (지역명 · 날짜 · 완료 퀘스트 수 자동 삽입)
// - 16을 거치지 않고 열면 기록 사진 앞 4장 + 첫 번째 템플릿
// - 이미지 저장: 카드를 1080 x 1920으로 캡처 → 앱은 사진 보관함에 저장, 웹은 파일 다운로드 (utils/saveStoryImage)
// - 공유하기(앱): 캡처한 파일로 공유 시트 호출. 웹은 숨김

import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS } from "../constants/colors";
import { moderateScale, scale, verticalScale } from "../utils/responsive";
import { formatDotDate } from "../utils/date";
import { getStoryDraft, StoryDraft } from "../utils/storyDraft";
import { canShareStoryImage, saveStoryImage, shareStoryImage } from "../utils/saveStoryImage";
import { isApiError } from "../api/client";
import { fetchRecordDetail, RecordDetail } from "../api/recordApi";
import { fetchStoryTemplates, STORY_MAX_PHOTOS } from "../api/storyApi";
import { LogoHeader } from "../components/ScreenHeader";
import PrimaryButton from "../components/common/PrimaryButton";
import { useToast } from "../components/Toast";
import StoryCard, { getStoryLayout } from "../components/story/StoryCard";

interface StoryPreviewScreenProps {
  recordId: number;
}

// 9:16 기록 이미지 (API명세서 13장 image_ratio 기본값)
const CARD_WIDTH = 288;
const CARD_HEIGHT = (CARD_WIDTH * 16) / 9;

const fileNameOf = (record: RecordDetail) =>
  `meokgo-${record.region_name}-${formatDotDate(record.created_at).replace(/\.\s?/g, "")}.png`;

export default function StoryPreviewScreen({ recordId }: StoryPreviewScreenProps) {
  const cardRef = useRef<View>(null);
  const [record, setRecord] = useState<RecordDetail | null>(null);
  const [draft, setDraft] = useState<StoryDraft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [saving, setSaving] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [canShare, setCanShare] = useState(false);
  const { showToast, toast } = useToast();

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchRecordDetail(recordId), fetchStoryTemplates()]).then(
      ([detail, templates]) => {
        if (cancelled) return;
        setRecord(detail);
        setDraft(
          getStoryDraft(recordId) ?? {
            template_id: templates[0]?.template_id ?? 1,
            photos: detail.photos.slice(0, STORY_MAX_PHOTOS),
          },
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

  useEffect(() => {
    let cancelled = false;
    canShareStoryImage().then(
      (available) => {
        if (!cancelled) setCanShare(available);
      },
      () => {},
    );
    return () => {
      cancelled = true;
    };
  }, []);

  const retry = () => {
    setError(null);
    setReloadKey((key) => key + 1);
  };

  const handleSave = async () => {
    if (!record || saving) return;
    setSaving(true);
    try {
      const result = await saveStoryImage(cardRef, fileNameOf(record));
      if (result === "denied") showToast("사진 보관함 접근을 허용하면 저장할 수 있어요");
      else showToast("이미지를 저장했어요", { icon: "check" });
    } catch {
      showToast("이미지를 저장하지 못했어요. 다시 시도해주세요");
    } finally {
      setSaving(false);
    }
  };

  const handleShare = async () => {
    if (sharing) return;
    setSharing(true);
    try {
      await shareStoryImage(cardRef);
    } catch {
      showToast("공유하지 못했어요. 다시 시도해주세요");
    } finally {
      setSharing(false);
    }
  };

  const width = scale(CARD_WIDTH);
  const height = scale(CARD_HEIGHT);

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.mobileWrapper}>
        <LogoHeader title="기록 남기기" />

        <View style={styles.body}>
          {record && draft ? (
            <View style={[styles.cardShadow, { borderRadius: scale(20) }]}>
              <StoryCard
                ref={cardRef}
                layout={getStoryLayout(draft.template_id)}
                photoUrls={draft.photos.map((photo) => photo.photo_url)}
                regionName={record.region_name}
                dateText={formatDotDate(record.created_at)}
                questCount={record.completed_quests.filter((q) => q.completed).length}
                width={width}
                height={height}
              />
            </View>
          ) : error ? (
            <>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity onPress={retry} style={styles.retry}>
                <Text style={styles.retryText}>다시 시도</Text>
              </TouchableOpacity>
            </>
          ) : (
            <ActivityIndicator color={COLORS.primary} />
          )}
        </View>

        <View style={styles.footer}>
          <PrimaryButton
            label="이미지 저장"
            onPress={handleSave}
            disabled={!record}
            loading={saving}
          />
          {canShare && record && (
            <TouchableOpacity
              onPress={handleShare}
              disabled={sharing}
              style={styles.share}
              accessibilityRole="button"
            >
              {sharing ? (
                <ActivityIndicator color={COLORS.textSub} />
              ) : (
                <Text style={styles.shareText}>공유하기</Text>
              )}
            </TouchableOpacity>
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
  body: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  cardShadow: {
    backgroundColor: COLORS.background,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 6,
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
    paddingTop: verticalScale(12),
    paddingBottom: verticalScale(16),
  },
  share: {
    marginTop: verticalScale(6),
    height: verticalScale(40),
    justifyContent: "center",
    alignItems: "center",
  },
  shareText: {
    fontSize: moderateScale(14),
    fontWeight: "bold",
    color: COLORS.textSub,
  },
});
