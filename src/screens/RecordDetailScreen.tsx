// src/screens/RecordDetailScreen.tsx

import React from "react";
import ScreenPlaceholder from "../components/dev/ScreenPlaceholder";

interface RecordDetailScreenProps {
  recordId: number;
}

export default function RecordDetailScreen({ recordId }: RecordDetailScreenProps) {
  return <ScreenPlaceholder title="15. 탐험 기록" params={{ recordId }} />;
}
