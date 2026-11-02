// src/screens/ExplorationProgressScreen.tsx

import React from "react";
import ScreenPlaceholder from "../components/dev/ScreenPlaceholder";

interface ExplorationProgressScreenProps {
  roomId: number;
}

export default function ExplorationProgressScreen({ roomId }: ExplorationProgressScreenProps) {
  return <ScreenPlaceholder title="11. 탐험 진행 중" params={{ roomId }} />;
}
