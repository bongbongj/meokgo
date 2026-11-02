import React from "react";
import { useLocalSearchParams } from "expo-router";
import StoryScreen from "../../../screens/StoryScreen";

export default function Story() {
  const { recordId } = useLocalSearchParams<{ recordId: string }>();
  return <StoryScreen recordId={Number(recordId)} />;
}
