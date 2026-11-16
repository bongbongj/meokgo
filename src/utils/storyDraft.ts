// src/utils/storyDraft.ts
// 16 스토리 템플릿 선택 ↔ 17 기록 미리보기가 함께 쓰는 선택 상태 (메모리 보관)
// 화면 이동 시 record_id 외의 값은 파라미터로 넘기지 않으므로 (FE 협업 규칙 4.1) 여기에 기록별로 둔다.
// 앱을 다시 시작하면 사라지고, 17은 값이 없으면 기록 사진 + 첫 번째 템플릿으로 그린다.
// 16은 다시 열릴 때(17에서 뒤로 가기 포함) 여기 값으로 고른 사진을 되살린다.
//
// 사진은 17에서 저장·공유할 때 한 번만 서버에 올린다.
// - 그 전까지는 기기 사진(local)으로만 들고 있어 16에서 자유롭게 바꿀 수 있다
// - 서버에는 올린 사진을 지우는 API가 없어, 올라간 사진(photo_id 있음)은 바꿀 수 없다

import type { LocalPhoto } from "../api/storyApi";

export interface DraftPhoto {
  photo_url: string; // 화면에 그릴 주소 (기기 사진이면 기기 경로)
  photo_id?: number; // 서버에 올라간 사진
  local?: LocalPhoto; // 아직 올리지 않은 기기 사진
}

export interface StoryDraft {
  template_id: number;
  slots: (DraftPhoto | null)[]; // 16의 사진 칸 4개 그대로 (빈 칸은 null)
}

/** 템플릿에 그릴 사진 — 칸 순서대로, 빈 칸 제외 */
export const draftPhotos = (draft: StoryDraft): DraftPhoto[] =>
  draft.slots.filter((slot): slot is DraftPhoto => slot !== null);

const drafts = new Map<number, StoryDraft>();

export const saveStoryDraft = (recordId: number, draft: StoryDraft) => {
  drafts.set(recordId, draft);
};

export const getStoryDraft = (recordId: number): StoryDraft | null =>
  drafts.get(recordId) ?? null;
