// src/screens/VoteStatusScreen.tsx

import React from "react";
import ScreenPlaceholder from "../components/dev/ScreenPlaceholder";

interface VoteStatusScreenProps {
  roomId: number;
}

export default function VoteStatusScreen({ roomId }: VoteStatusScreenProps) {
  return <ScreenPlaceholder title="08. 투표 현황 / 09. 투표 대기" params={{ roomId }} />;
}
