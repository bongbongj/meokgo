// src/screens/StoryPreviewScreen.tsx

import React from "react";
import ScreenPlaceholder from "../components/dev/ScreenPlaceholder";

interface StoryPreviewScreenProps {
  recordId: number;
}

export default function StoryPreviewScreen({ recordId }: StoryPreviewScreenProps) {
  return <ScreenPlaceholder title="16. 기록 미리보기" params={{ recordId }} />;
}
