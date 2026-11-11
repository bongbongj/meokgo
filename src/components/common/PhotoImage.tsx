// src/components/common/PhotoImage.tsx
// 기록 사진 표시
// - 서버 사진(/api/v1/...로 시작하는 상대 경로)은 서버 주소를 붙이고 X-Device-Key 헤더와 함께 요청한다
// - 더미 사진(mock://), 기기 사진(file:// 등), 절대 주소는 그대로 표시

import { Image, ImageProps } from "expo-image";
import React, { useEffect, useState } from "react";
import { SERVER_URL } from "../../api/client";
import { getDeviceKey } from "../../api/deviceKey";
import { getPhotoSource } from "../../api/recordApi";

interface PhotoImageProps extends Omit<ImageProps, "source"> {
  url: string;
}

const isServerPath = (url: string) => url.startsWith("/");

export default function PhotoImage({ url, ...props }: PhotoImageProps) {
  const [deviceKey, setDeviceKey] = useState<string | null>(null);
  const fromServer = isServerPath(url);

  useEffect(() => {
    if (!fromServer) return;
    let ignore = false;
    getDeviceKey().then((key) => {
      if (!ignore) setDeviceKey(key);
    });
    return () => {
      ignore = true;
    };
  }, [fromServer]);

  if (!fromServer) {
    return <Image {...props} source={getPhotoSource(url) as ImageProps["source"]} />;
  }

  // 개인 사진은 서버가 캐시 금지로 내려주므로 디스크에 남기지 않는다
  return (
    <Image
      {...props}
      cachePolicy="memory"
      source={
        deviceKey
          ? { uri: `${SERVER_URL}${url}`, headers: { "X-Device-Key": deviceKey } }
          : null
      }
    />
  );
}
