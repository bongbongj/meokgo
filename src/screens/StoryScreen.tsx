// src/screens/StoryScreen.tsx

import React from "react";
import ScreenPlaceholder from "../components/dev/ScreenPlaceholder";

interface StoryScreenProps {
  recordId: number;
}

export default function StoryScreen({ recordId }: StoryScreenProps) {
  return <ScreenPlaceholder title="15. 기록 남기기" params={{ recordId }} />;
}
