// src/utils/nickname.ts

export const NICKNAME_MAX_LENGTH = 10;

/**
 * 한글·영문·숫자만 남기고, 최대 글자 수를 넘으면 null (초과 입력 무시)
 */
export const filterNickname = (text: string): string | null => {
  const filtered = text.replace(/[^가-힣ㄱ-ㅎㅏ-ㅣa-zA-Z0-9]/g, "");
  return filtered.length <= NICKNAME_MAX_LENGTH ? filtered : null;
};

export const isValidNickname = (nickname: string): boolean => {
  const length = nickname.trim().length;
  return length >= 1 && length <= NICKNAME_MAX_LENGTH;
};
