import React from "react";
import { useLocalSearchParams } from "expo-router";
import StoryPreviewScreen from "../../../screens/StoryPreviewScreen";

export default function StoryPreview() {
  const { recordId } = useLocalSearchParams<{ recordId: string }>();
  return <StoryPreviewScreen recordId={Number(recordId)} />;
}
