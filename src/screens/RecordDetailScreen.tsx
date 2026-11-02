// src/screens/RecordDetailScreen.tsx

import React from "react";
import ScreenPlaceholder from "../components/dev/ScreenPlaceholder";

interface RecordDetailScreenProps {
  recordId: number;
}

export default function RecordDetailScreen({ recordId }: RecordDetailScreenProps) {
  return <ScreenPlaceholder title="14. 탐험 기록 상세" params={{ recordId }} />;
}
