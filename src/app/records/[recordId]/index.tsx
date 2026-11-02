import React from "react";
import { useLocalSearchParams } from "expo-router";
import RecordDetailScreen from "../../../screens/RecordDetailScreen";

export default function RecordDetail() {
  const { recordId } = useLocalSearchParams<{ recordId: string }>();
  return <RecordDetailScreen recordId={Number(recordId)} />;
}
