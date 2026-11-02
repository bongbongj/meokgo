import React from "react";
import { useLocalSearchParams } from "expo-router";
import ExplorationFinishScreen from "../../../screens/ExplorationFinishScreen";

export default function ExplorationFinish() {
  const { roomId } = useLocalSearchParams<{ roomId: string }>();
  return <ExplorationFinishScreen roomId={Number(roomId)} />;
}
