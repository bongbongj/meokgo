// src/utils/responsive.ts
import { Dimensions, Platform } from "react-native";

// 피그마 디자인 기준 규격 (393 x 852)
const FIGMA_BASE_WIDTH = 393;
const FIGMA_BASE_HEIGHT = 852;

// 현재 기기 화면 크기 (웹 환경에서는 최대 393px로 보정)
const { width: rawWidth, height: rawHeight } = Dimensions.get("window");
const screenWidth = Platform.OS === "web" ? Math.min(rawWidth, 393) : rawWidth;
const screenHeight = rawHeight;

/**
 * 가로 비율 기준 스케일 (너비, 좌우 마진 등)
 */
export const scale = (size: number): number => {
  return (screenWidth / FIGMA_BASE_WIDTH) * size;
};

/**
 * 세로 비율 기준 스케일 (높이, 상하 마진 등)
 */
export const verticalScale = (size: number): number => {
  return (screenHeight / FIGMA_BASE_HEIGHT) * size;
};

/**
 * 폰트 및 아이콘 크기 완충 스케일
 * (너무 작아지거나 커지지 않도록 비율 계수를 0.5로 완충)
 */
export const moderateScale = (size: number, factor = 0.5): number => {
  return size + (scale(size) - size) * factor;
};
