// src/screens/QuestConfirmScreen.tsx

import React from "react";
import ScreenPlaceholder from "../components/dev/ScreenPlaceholder";

interface QuestConfirmScreenProps {
  roomId: number;
}

export default function QuestConfirmScreen({ roomId }: QuestConfirmScreenProps) {
  return <ScreenPlaceholder title="10. 퀘스트 확정" params={{ roomId }} />;
}
