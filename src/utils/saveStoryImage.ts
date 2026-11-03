// src/utils/saveStoryImage.ts
// 17 기록 미리보기 — 기록 이미지 저장 / 공유 (앱)
// 웹은 saveStoryImage.web.ts (expo-media-library가 웹을 지원하지 않아 파일을 나눔)

import type { RefObject } from "react";
import { PixelRatio, Platform, View } from "react-native";
import { captureRef } from "react-native-view-shot";
import "./ignoreMediaLibraryWarning";
// 새 클래스 API(expo-media-library)의 ExpoMediaLibraryNext 모듈이 없는 Expo Go가 있어 legacy API 사용
import * as MediaLibrary from "expo-media-library/legacy";
import * as Sharing from "expo-sharing";

// 9:16 기록 이미지 1080 x 1920 px — width / height 단위가 iOS는 pt(기기 배율을 곱해 렌더), Android는 px
const pixelUnit = Platform.OS === "ios" ? PixelRatio.get() : 1;
const captureFile = (ref: RefObject<View | null>) =>
  captureRef(ref, {
    format: "png",
    quality: 1,
    result: "tmpfile",
    width: 1080 / pixelUnit,
    height: 1920 / pixelUnit,
  });

/** 사진 보관함에 저장 — 권한을 거부하면 "denied" */
export const saveStoryImage = async (
  ref: RefObject<View | null>,
  _fileName: string,
): Promise<"saved" | "denied"> => {
  // 쓰기 전용이면 Android도 사진 읽기 권한(granular)을 요청하지 않음 — ["photo"]를 넘기면 Expo Go(Android)에서 예외
  const permission = await MediaLibrary.requestPermissionsAsync(true);
  if (!permission.granted) return "denied";
  await MediaLibrary.saveToLibraryAsync(await captureFile(ref));
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
