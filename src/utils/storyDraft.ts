// src/utils/storyDraft.ts
// 16 스토리 템플릿 선택 → 17 기록 미리보기로 넘길 선택 상태 (메모리 보관)
// 화면 이동 시 record_id 외의 값은 파라미터로 넘기지 않으므로 (FE 협업 규칙 4.1) 여기에 기록별로 둔다.
// 앱을 다시 시작하면 사라지고, 17은 값이 없으면 기록 사진 + 첫 번째 템플릿으로 그린다.

import type { RecordPhoto } from "../api/recordApi";

export interface StoryDraft {
  template_id: number;
  photos: RecordPhoto[]; // 슬롯 순서대로, 빈 슬롯은 제외 (최대 4장)
}

const drafts = new Map<number, StoryDraft>();

export const saveStoryDraft = (recordId: number, draft: StoryDraft) => {
  drafts.set(recordId, draft);
};

export const getStoryDraft = (recordId: number): StoryDraft | null =>
  drafts.get(recordId) ?? null;
