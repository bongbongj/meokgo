// src/utils/ignoreMediaLibraryWarning.ts
// expo-media-library(legacy)는 Android Expo Go에서 불러오기만 해도 경고를 띄운다
// 기록 이미지는 쓰기 전용 저장만 해서 Expo Go에서도 동작하므로 LogBox에서만 숨김 (콘솔에는 남음)
// saveStoryImage.ts에서 expo-media-library보다 먼저 import해야 함

import { LogBox } from "react-native";

LogBox.ignoreLogs(["Expo Go can no longer provide full access to the media library"]);
