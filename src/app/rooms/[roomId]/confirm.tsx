import React from "react";
import { useLocalSearchParams } from "expo-router";
import QuestConfirmScreen from "../../../screens/QuestConfirmScreen";

export default function QuestConfirm() {
  const { roomId } = useLocalSearchParams<{ roomId: string }>();
  return <QuestConfirmScreen roomId={Number(roomId)} />;
}
