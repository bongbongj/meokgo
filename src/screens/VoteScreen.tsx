// src/screens/VoteScreen.tsx

import React from "react";
import ScreenPlaceholder from "../components/dev/ScreenPlaceholder";

interface VoteScreenProps {
  roomId: number;
}

export default function VoteScreen({ roomId }: VoteScreenProps) {
  return <ScreenPlaceholder title="07. 퀘스트 투표" params={{ roomId }} />;
}
