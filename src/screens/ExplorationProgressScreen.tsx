// src/screens/ExplorationProgressScreen.tsx

import React from "react";
import ScreenPlaceholder from "../components/dev/ScreenPlaceholder";

interface ExplorationProgressScreenProps {
  roomId: number;
}

export default function ExplorationProgressScreen({ roomId }: ExplorationProgressScreenProps) {
  return <ScreenPlaceholder title="10-2. 퀘스트 진행" params={{ roomId }} />;
}
