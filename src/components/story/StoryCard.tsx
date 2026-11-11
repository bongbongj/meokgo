// src/components/story/StoryCard.tsx
// 기록 이미지 템플릿 (16 템플릿 썸네일, 17 기록 미리보기 / 캡처)
// - MOOD: 왼쪽 큰 사진(첫 번째) + 오른쪽 작은 사진(나머지) + 지역명 · 날짜 · 완료 퀘스트 수
// - 콜라주: 사진을 세로로 같은 높이로 쌓고, 아래쪽에 지역명 · 날짜
// - 사진은 선택한 것만 넘긴다 (빈 슬롯은 템플릿에서 제외)
// - 크기는 width / height로 정하고, 안쪽 여백 · 글자 크기는 width에 비례 (썸네일과 미리보기가 같은 모양)

import React, { forwardRef } from "react";
import { StyleSheet, Text, View } from "react-native";
import { COLORS } from "../../constants/colors";
import PhotoImage from "../common/PhotoImage";

export type StoryLayout = "mood" | "collage";

/** template_id → 레이아웃 (API에 레이아웃 구분 값이 없어 디자인 순서로 매핑 — README 컨펌 필요 사항) */
export const getStoryLayout = (templateId: number): StoryLayout =>
  templateId === 2 ? "collage" : "mood";

interface StoryCardProps {
  layout: StoryLayout;
  photoUrls: string[];
  regionName: string;
  dateText: string;
  questCount: number;
  width: number;
  height: number;
}

const StoryCard = forwardRef<View, StoryCardProps>(function StoryCard(
  { layout, photoUrls, regionName, dateText, questCount, width, height },
  ref,
) {
  const unit = width / 288; // 17 디자인 카드 너비 288 기준
  const radius = 20 * unit;
  const [main, ...rest] = photoUrls;

  const caption = (light: boolean) => (
    <>
      <Text
        style={[styles.region, { fontSize: 16 * unit }, light && styles.light]}
        numberOfLines={1}
      >
        {regionName} 탐험
      </Text>
      <Text style={[styles.meta, { fontSize: 9 * unit, marginTop: 4 * unit }, light && styles.light]}>
        {dateText} · 퀘스트 {questCount}개 완료
      </Text>
    </>
  );

  return (
    <View
      ref={ref}
      collapsable={false}
      style={[styles.card, { width, height, borderRadius: radius }]}
    >
      {layout === "mood" ? (
        <View style={styles.row}>
          {main && <PhotoImage url={main} style={styles.moodMain} />}
          <View
            style={[
              styles.moodSide,
              { padding: 13 * unit, paddingTop: 22 * unit, gap: 13 * unit },
            ]}
          >
            {rest.map((url, index) => (
              <PhotoImage
                key={`${url}-${index}`}
                url={url}
                style={[styles.moodPhoto, { height: height * 0.228, borderRadius: 3 * unit }]}
              />
            ))}
            <View style={{ marginTop: 10 * unit }}>{caption(false)}</View>
          </View>
        </View>
      ) : (
        <View style={styles.column}>
          {photoUrls.map((url, index) => (
            <PhotoImage key={`${url}-${index}`} url={url} style={styles.collagePhoto} />
          ))}
          <View
            style={[
              styles.collageCaption,
              { left: 14 * unit, right: 14 * unit, bottom: 14 * unit, padding: 10 * unit, borderRadius: 10 * unit },
            ]}
          >
            {caption(true)}
          </View>
        </View>
      )}
    </View>
  );
});

export default StoryCard;

const styles = StyleSheet.create({
  card: {
    overflow: "hidden",
    backgroundColor: COLORS.background,
  },
  row: { flex: 1, flexDirection: "row" },
  column: { flex: 1 },
  moodMain: { width: "55.7%", height: "100%" },
  moodSide: { flex: 1 },
  moodPhoto: { width: "100%" },
  collagePhoto: { flex: 1, width: "100%" },
  collageCaption: {
    position: "absolute",
    backgroundColor: "rgba(0, 0, 0, 0.45)",
  },
  region: { fontWeight: "bold", color: COLORS.textMain },
  meta: { color: COLORS.textSub },
  light: { color: COLORS.background },
});
