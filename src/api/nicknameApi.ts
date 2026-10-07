interface NicknameRequest {
  nickname: string;
}

interface NicknameResponse {
  success: boolean;
  data: {
    user_id: number;
    nickname: string;
    first_launch: boolean;
  };
}

export const setNickname = async (
  data: NicknameRequest,
): Promise<NicknameResponse> => {
  // 실제 서버 통신처럼 0.5초 딜레이를 줌
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        data: {
          user_id: 1, // 더미 유저 ID
          nickname: data.nickname,
          first_launch: false,
        },
      });
    }, 500);
  });
};
