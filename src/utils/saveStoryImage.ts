// src/utils/saveStoryImage.ts
// 17 기록 미리보기 — 기록 이미지 저장 / 공유 (앱)
// 웹은 saveStoryImage.web.ts (expo-media-library가 웹을 지원하지 않아 파일을 나눔)

import type { RefObject } from "react";
import { PixelRatio, View } from "react-native";
import { captureRef } from "react-native-view-shot";
import * as MediaLibrary from "expo-media-library";
import * as Sharing from "expo-sharing";

// 9:16 기록 이미지 1080 x 1920 px — 앱은 dp 단위라 화면 배율로 나눈다 (react-native-view-shot 문서)
const captureFile = (ref: RefObject<View | null>) =>
  captureRef(ref, {
    format: "png",
    quality: 1,
    result: "tmpfile",
    width: 1080 / PixelRatio.get(),
    height: 1920 / PixelRatio.get(),
  });

/** 사진 보관함에 저장 — 권한을 거부하면 "denied" */
export const saveStoryImage = async (
  ref: RefObject<View | null>,
  _fileName: string,
): Promise<"saved" | "denied"> => {
  const permission = await MediaLibrary.requestPermissionsAsync(true, ["photo"]);
  if (!permission.granted) return "denied";
  await MediaLibrary.Asset.create(await captureFile(ref));
  return "saved";
};

export const canShareStoryImage = () => Sharing.isAvailableAsync();

/** 공유 시트 호출 */
export const shareStoryImage = async (ref: RefObject<View | null>) => {
  await Sharing.shareAsync(await captureFile(ref), {
    mimeType: "image/png",
    UTI: "public.png",
    dialogTitle: "기록 이미지 공유",
  });
};
