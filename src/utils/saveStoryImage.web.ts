// src/utils/saveStoryImage.web.ts
// 17 기록 미리보기 — 기록 이미지 저장 (웹)
// 사진 보관함이 없으므로 PNG 파일로 내려받는다. 로컬 파일 공유는 웹에서 지원하지 않아 공유는 숨김 (expo-sharing 문서)

import type { RefObject } from "react";
import type { View } from "react-native";
import { captureRef } from "react-native-view-shot";

export const saveStoryImage = async (
  ref: RefObject<View | null>,
  fileName: string,
): Promise<"saved" | "denied"> => {
  // 웹은 px 단위 (9:16, 1080 x 1920)
  const dataUri = await captureRef(ref, {
    format: "png",
    quality: 1,
    result: "data-uri",
    width: 1080,
    height: 1920,
  });
  const link = document.createElement("a");
  link.href = dataUri;
  link.download = fileName;
  link.click();
  return "saved";
};

export const canShareStoryImage = async () => false;

export const shareStoryImage = async (_ref: RefObject<View | null>) => {};
