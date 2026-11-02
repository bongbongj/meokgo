import React from "react";
import { useLocalSearchParams } from "expo-router";
import VoteScreen from "../../../screens/VoteScreen";

export default function Vote() {
  const { roomId } = useLocalSearchParams<{ roomId: string }>();
  return <VoteScreen roomId={Number(roomId)} />;
}
