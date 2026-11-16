// src/utils/storyPhoto.ts
// 기록 사진을 올리기 전에 줄여서 JPEG로 바꾼다 (16 기록 남기기)
// - BE는 JPG·PNG만 받고 한 장 10MB까지 허용하며, 받은 사진을 긴 변 2048px로 줄여 저장한다
// - 그래서 같은 크기로 미리 줄여 보내면 용량 초과가 없어지고, HEIC 사진도 JPEG로 바뀌어 올라간다

import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { isApiError } from "../api/client";
import { uploadRecordPhotos } from "../api/storyApi";
import type { LocalPhoto } from "../api/storyApi";
import { getStoryDraft, saveStoryDraft } from "./storyDraft";
import type { StoryDraft } from "./storyDraft";

export const getUploadErrorMessage = (error: unknown): string => {
  if (!isApiError(error)) return "사진을 올리지 못했어요. 다시 시도해주세요";
  switch (error.code) {
    case "FILE-001":
      // 사진은 올리기 전에 JPEG로 바꾸므로 형식보다는 장수 초과인 경우다
      return "사진을 더 올릴 수 없어요. 기록 하나에 4장까지 올릴 수 있어요";
    case "TIMEOUT":
      return "사진을 올리는 데 시간이 오래 걸려요. 연결 상태를 확인하고 다시 시도해주세요";
    case "NETWORK":
      return "사진을 올리지 못했어요. 연결 상태를 확인하고 다시 시도해주세요";
    default:
      return error.message;
  }
};

const uploadsInFlight = new Map<number, Promise<void>>();

/**
 * 초안의 기기 사진을 서버에 올리고, 초안을 올라간 사진으로 바꿔 둔다 (17 저장·공유 시 호출).
 * - 이미 모두 올라갔으면 아무것도 하지 않는다
 * - 저장과 공유를 연달아 눌러도 한 번만 올린다
 */
export const uploadDraftPhotos = (recordId: number, draft: StoryDraft): Promise<void> => {
  const running = uploadsInFlight.get(recordId);
  if (running) return running;

  // 16으로 돌아가 바뀌었을 수 있으므로 저장된 초안이 있으면 그쪽이 기준
  const current = getStoryDraft(recordId) ?? draft;
  const locals = current.slots.flatMap((slot) => (slot?.local ? [slot.local] : []));
  if (locals.length === 0) return Promise.resolve();

  const task = uploadRecordPhotos(recordId, locals)
    .then(({ photos: uploaded }) => {
      // 업로드 결과를 고른 순서대로 다시 끼워 넣는다
      let next = 0;
      saveStoryDraft(recordId, {
        ...current,
        slots: current.slots.map((slot) => (slot?.local ? { ...uploaded[next++] } : slot)),
      });
    })
    .finally(() => uploadsInFlight.delete(recordId));
  uploadsInFlight.set(recordId, task);
  return task;
};

const MAX_SIDE = 2048; // BE 저장 크기와 같게
const JPEG_QUALITY = 0.85;

interface PickedPhoto {
  uri: string;
  width: number;
  height: number;
}

/**
 * 고른 사진을 업로드용으로 변환한다.
 * 기기에서 읽을 수 없는 형식(예: 일부 브라우저의 HEIC)이면 오류를 던진다.
 */
export const prepareStoryPhoto = async (
  photo: PickedPhoto,
  index: number,
): Promise<LocalPhoto> => {
  const context = ImageManipulator.manipulate(photo.uri);
  // 긴 변만 지정하면 비율은 유지된다
  // (웹 구현은 null을 "지정 안 함"으로 처리하지 못하므로 쓰지 않는 변은 아예 넘기지 않는다)
  if (Math.max(photo.width, photo.height) > MAX_SIDE) {
    context.resize(
      photo.width >= photo.height ? { width: MAX_SIDE } : { height: MAX_SIDE },
    );
  }
  const rendered = await context.renderAsync();
  const result = await rendered.saveAsync({
    format: SaveFormat.JPEG,
    compress: JPEG_QUALITY,
  });
  return {
    uri: result.uri,
    fileName: `photo-${index + 1}.jpg`,
    mimeType: "image/jpeg",
  };
};
