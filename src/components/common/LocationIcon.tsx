// src/components/common/LocationIcon.tsx
// 지역(위치) 아이콘 — Figma `boxicons:location-filled` (20x20) 벡터를 그대로 옮긴 것
// SymbolView는 iOS(SF Symbol)와 Android/웹(Material)에서 모양이 달라서,
// 모든 플랫폼에서 디자인과 같은 물방울 핀이 나오도록 SVG로 직접 그린다.

import React from "react";
import Svg, { Path } from "react-native-svg";

interface LocationIconProps {
  size: number;
  color: string;
}

export default function LocationIcon({ size, color }: LocationIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Path
        d="M10 1.66669C6.325 1.66669 3.33333 4.65835 3.33333 8.33335C3.30833 13.7 9.26666 18 9.51666 18.1834C9.65833 18.2834 9.83333 18.3417 10 18.3417C10.1667 18.3417 10.3417 18.2917 10.4833 18.1834C10.7333 18 16.6917 13.7084 16.6667 8.33335C16.6667 4.65835 13.675 1.66669 10 1.66669ZM10 11.6667C8.15833 11.6667 6.66666 10.175 6.66666 8.33335C6.66666 6.49169 8.15833 5.00002 10 5.00002C11.8417 5.00002 13.3333 6.49169 13.3333 8.33335C13.3333 10.175 11.8417 11.6667 10 11.6667Z"
        fill={color}
      />
    </Svg>
  );
}
