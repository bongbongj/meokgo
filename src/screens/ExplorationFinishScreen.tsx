// src/screens/ExplorationFinishScreen.tsx

import React from "react";
import ScreenPlaceholder from "../components/dev/ScreenPlaceholder";

interface ExplorationFinishScreenProps {
  roomId: number;
}

export default function ExplorationFinishScreen({ roomId }: ExplorationFinishScreenProps) {
  return <ScreenPlaceholder title="18. 탐험 종료" params={{ roomId }} />;
}
