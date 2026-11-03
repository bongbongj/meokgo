// src/api/storyApi.ts
// FE2 — Story 템플릿, 기록 사진 업로드 (API명세서 13장)
// - 기록 이미지는 앱에서 템플릿을 그려 캡처한다 (17 기록 미리보기). 서버 Story 이미지 생성
//   (POST / GET /records/{id}/story-image)은 사용하지 않음 — README 컨펌 필요 사항

import { Platform } from "react-native";
import { api, ApiError } from "./client";
import { mockResolve, USE_MOCK } from "./mock";
import type { RecordPhoto } from "./recordApi";

export interface StoryTemplate {
  template_id: number;
  template_name: string;
  preview_url: string;
}

export interface PhotoUploadResult {
  record_id: number;
  photos: RecordPhoto[];
}

/** 업로드할 기기 사진 (expo-image-picker 결과) */
export interface LocalPhoto {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
}

// 사진 업로드 규칙 (16 화면정의 3장)
export const STORY_MAX_PHOTOS = 4;
export const STORY_PHOTO_MAX_BYTES = 10 * 1024 * 1024;
export const STORY_PHOTO_TYPES = ["image/jpeg", "image/png"];

// BE 미구현 API — 구현되면 false로 바꾸고 USE_MOCK.story를 따르게 한다
const STORY_API_PENDING = true;

const isMocked = () => STORY_API_PENDING || USE_MOCK.story;

// 디자인 시안: 01 MOOD / 02 콜라주
const MOCK_TEMPLATES: StoryTemplate[] = [
  { template_id: 1, template_name: "MOOD", preview_url: "" },
  { template_id: 2, template_name: "콜라주", preview_url: "" },
];

let mockPhotoId = 100;

/** Story 템플릿 목록 */
export const fetchStoryTemplates = async (): Promise<StoryTemplate[]> => {
  if (isMocked()) return mockResolve(MOCK_TEMPLATES);
  const data = await api.get<{ templates: StoryTemplate[] }>("/story-templates");
  return data.templates;
};

/** 웹은 blob으로, 앱은 { uri, name, type } 형태로 FormData에 넣는다 */
const appendPhoto = async (form: FormData, photo: LocalPhoto, index: number) => {
  const type = photo.mimeType ?? "image/jpeg";
  const name = photo.fileName ?? `photo-${index + 1}.${type === "image/png" ? "png" : "jpg"}`;
  if (Platform.OS === "web") {
    const blob = await (await fetch(photo.uri)).blob();
    form.append("photos", blob, name);
  } else {
    // React Native FormData는 파일을 { uri, name, type } 객체로 받는다
    form.append("photos", { uri: photo.uri, name, type } as unknown as Blob);
  }
};

/** 기록 사진 업로드 — 1 ~ 4장 */
export const uploadRecordPhotos = async (
  recordId: number,
  photos: LocalPhoto[],
): Promise<PhotoUploadResult> => {
  if (photos.length < 1 || photos.length > STORY_MAX_PHOTOS) {
    throw new ApiError("FILE-001", "사진은 1장부터 4장까지 올릴 수 있어요.", 400);
  }
  if (isMocked()) {
    return mockResolve(
      {
        record_id: recordId,
        photos: photos.map((photo) => ({ photo_id: (mockPhotoId += 1), photo_url: photo.uri })),
      },
      500,
    );
  }
  const form = new FormData();
  await Promise.all(photos.map((photo, index) => appendPhoto(form, photo, index)));
  return api.upload<PhotoUploadResult>(`/records/${recordId}/photos`, form);
};
