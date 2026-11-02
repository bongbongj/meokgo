import React from "react";
import { useLocalSearchParams } from "expo-router";
import VoteStatusScreen from "../../../screens/VoteStatusScreen";

export default function VoteStatus() {
  const { roomId } = useLocalSearchParams<{ roomId: string }>();
  return <VoteStatusScreen roomId={Number(roomId)} />;
}
