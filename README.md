# 먹으러GO FE

친구와 퀘스트를 고르고 함께 외식하며 새로운 동네를 탐험하는 앱의 프론트엔드입니다.

- 스택: Expo SDK 57, Expo Router, React Native 0.86, TypeScript
- 통합 브랜치: `FE` (작업은 `feat/<담당>-<기능>` 브랜치 → PR → `FE`에 머지)
- 상세 협업 규칙: 공유 폴더의 `FE 협업 규칙.md`

## 실행

```bash
npm install
npx expo start          # 웹만 실행: npx expo start --web (포트 8081)
```

패키지는 `npx expo install <package>`로만 추가합니다.

## 환경 변수

`.env` (커밋됨)

| 변수 | 기본값 | 설명 |
| --- | --- | --- |
| `EXPO_PUBLIC_API_URL` | `http://localhost:8080` | BE 서버 주소 (`/api/v1` 제외) |
| `EXPO_PUBLIC_USE_MOCK` | `true` | `"false"`면 실서버, 그 외에는 더미 API |

- 개인 PC 전용 값(실기기 테스트용 PC IP 등)은 `.env.local`에 작성합니다. (커밋 제외)
- 값을 바꾼 뒤에는 개발 서버를 다시 시작해야 반영됩니다.

## API 모듈 (`src/api/`)

| 파일 | 역할 |
| --- | --- |
| `client.ts` | 공통 클라이언트. Base URL, 공통 헤더, 응답 / 오류 처리 |
| `deviceKey.ts` | `X-Device-Key` 생성(UUID) 및 기기 저장 |
| `mock.ts` | 도메인별 더미 / 실서버 전환 (`USE_MOCK`), `mockResolve()` |
| `types.ts` | `ApiResponse`, `ApiError` 코드, API명세서 2.5 Enum 타입 |

```ts
import { api, isApiError } from "../api/client";

// 성공 시 서버 응답의 data만 반환
const status = await api.get<VoteStatusResponse>(`/rooms/${roomId}/votes/status`);
await api.post(`/rooms/${roomId}/votes/me`, { candidate_ids: [1, 2] });

// 실패 시 ApiError (code로 분기)
try { ... } catch (e) {
  if (isApiError(e) && e.code === "VOTE-001") { /* 마감된 투표 */ }
}
```

- 모든 요청에 `X-Device-Key`가 자동으로 붙습니다. 같은 기기에서는 앱 삭제 전까지 같은 값을 사용합니다.
- 요청 / 응답 필드명은 서버와 같은 **snake_case**를 그대로 사용합니다.
- 오류 코드는 API명세서 2.4 + 클라이언트 전용 `NETWORK`(연결 실패), `TIMEOUT`(10초 초과), `UNKNOWN`입니다.
- BE가 아직 없는 API는 `USE_MOCK.<도메인>`이 `true`일 때 `mockResolve()`로 API명세서 응답 예시와 같은 구조의 더미를 반환하도록 만듭니다.
- 도메인별 API 파일은 API명세서 장 단위로 나눕니다. (`userApi.ts`, `voteApi.ts` 등)

## 라우트

라우트 파일(`src/app/`)은 주소의 ID만 꺼내 화면(`src/screens/`)에 넘깁니다.

| 주소 | 화면 | 담당 |
| --- | --- | --- |
| `/` | 00 스플래시 | FE1 |
| `/nickname` | 01 닉네임 설정 | FE1 |
| `/home` | 02 홈 | FE1 |
| `/rooms/:roomId/vote` | 07 퀘스트 투표 | FE2 |
| `/rooms/:roomId/vote-status` | 08 투표 현황 / 09 투표 대기 | FE2 |
| `/rooms/:roomId/confirm` | 10 퀘스트 확정 | FE2 |
| `/rooms/:roomId/progress` | 11 탐험 진행 중 | FE2 |
| `/rooms/:roomId/finish` | 12 탐험 종료 | FE2 |
| `/records` | 13 내 기록 (`(tabs)` 그룹) | FE2 |
| `/records/:recordId` | 14 탐험 기록 상세 | FE2 |
| `/records/:recordId/story` | 15 기록 남기기 | FE2 |
| `/records/:recordId/preview` | 16 기록 미리보기 | FE2 |

- FE2 화면은 현재 임시 화면(`ScreenPlaceholder`)입니다.
- FE1 → FE2 연결: 06 참여 대기에서 `` router.replace(`/rooms/${roomId}/vote`) ``

### FE1 참고

- 기존 `homeApi.ts`, `nicknameApi.ts`를 `client.ts` / `mock.ts` 구조로 옮겨주세요.
- `(tabs)/_layout.tsx`(하단 탭)와 `home.tsx`의 `(tabs)` 이동은 FE1 담당입니다.
- 템플릿에서 남은 기존 오류 2건: `src/components/app-tabs.web.tsx`(삭제된 `/explore` 참조, tsc), `src/hooks/use-color-scheme.web.ts`(lint)

## BE 연동 메모

2026-11-03 로컬 BE(`local-h2` 프로필)와 연동 확인: 닉네임 등록, 지역 조회, 방 생성, 대기 상태, 투표 시작, 후보 생성 / 조회, 투표 저장 / 수정, 오류 응답(`COMMON-001`, `ROOM-001`) 정상.

- CORS: FE 웹 개발 서버는 `http://localhost:8081` (BE 기본 허용 목록에 포함)
- 확인 요청 사항
  - `/api/v1/health`도 `X-Device-Key` 없으면 400 반환
  - 검증 오류의 `errors[].field`가 camelCase(`candidateIds`)로 내려옴 (요청 / 응답은 snake_case)
  - 방장으로 `VOTING` 중인 방이 있어도 `bootstrap`이 `has_active_room: false` 반환
