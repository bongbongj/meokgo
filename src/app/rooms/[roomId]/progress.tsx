import React from "react";
import { useLocalSearchParams } from "expo-router";
import ExplorationProgressScreen from "../../../screens/ExplorationProgressScreen";

export default function ExplorationProgress() {
  const { roomId } = useLocalSearchParams<{ roomId: string }>();
  return <ExplorationProgressScreen roomId={Number(roomId)} />;
}
