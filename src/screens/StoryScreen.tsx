// src/screens/StoryScreen.tsx

import React from "react";
import ScreenPlaceholder from "../components/dev/ScreenPlaceholder";

interface StoryScreenProps {
  recordId: number;
}

export default function StoryScreen({ recordId }: StoryScreenProps) {
  return <ScreenPlaceholder title="16. 스토리 템플릿 선택" params={{ recordId }} />;
}
