# 먹으러GO FE

친구와 퀘스트를 고르고 함께 외식하며 새로운 동네를 탐험하는 앱의 프론트엔드입니다.

- 스택: Expo SDK 57, Expo Router, React Native 0.86, TypeScript
- 통합 브랜치: `FE` (작업은 `feat/<담당>-<기능>` 브랜치 → PR → `FE`에 머지)
- 상세 협업 규칙: [`reference/FE 협업 규칙.md`](reference/FE%20협업%20규칙.md)

## 참고 문서 (`reference/`)

| 문서 | 내용 |
| --- | --- |
| [`기능명세서.md`](reference/기능명세서.md) | Notion 기능명세서 사본. 기능 69개, 화면 번호, 담당(FE1 / FE2 / BE), 우선순위, 기한 |
| [`FE 협업 규칙.md`](reference/FE%20협업%20규칙.md) | 담당 범위, API 모듈, 라우트, 공통 컴포넌트, 브랜치 규칙 |
| [`먹으러GO 개발 가이드.md`](reference/먹으러GO%20개발%20가이드.md) | 컬러 토큰, 타이포그래피, 컴포넌트 규격, 닉네임 / 퀘스트 / 사진 규칙 |

- API명세서와 DB설계서는 BE 레포의 `reference/`를 봅니다.
- 원본이 따로 있는 문서(기능명세서: Notion)는 원본을 먼저 고치고 이 폴더에 반영합니다.

## 실행

```bash
npm install
npx expo start          # 웹만 실행: npx expo start --web (포트 8081)
```

패키지는 `npx expo install <package>`로만 추가합니다.

- 앱(웹): `http://localhost:8081` / BE: `http://localhost:8080`
- 머지 전 확인: `npx expo lint`, `npx tsc --noEmit`

## 화면 바로 열기 (앞 화면 건너뛰기)

주소창에 경로를 직접 입력하면 해당 화면으로 바로 들어갑니다.

### 더미 모드 (기본)

`.env`의 `EXPO_PUBLIC_USE_MOCK=true` 상태에서는 BE 없이 동작하며, 방 번호는 아무 숫자나 됩니다.

- 07 퀘스트 투표: `http://localhost:8081/rooms/1/vote`
- 09 투표 대기: `http://localhost:8081/rooms/1/vote-status`

### 실제 BE 모드

BE에 **투표 중인 방**이 있고, 그 방에 **지금 브라우저의 기기 키가 참여자로** 들어가 있어야 합니다.

1. BE 실행: MySQL이 없으면 IntelliJ `ServerApplication` 실행 설정에 환경 변수 `SPRING_PROFILES_ACTIVE=local-h2` 추가 후 실행 (메모리 DB — BE를 다시 켜면 방이 모두 사라짐)
2. FE 폴더에 `.env.local` 생성 후 `npx expo start` 재시작

   ```
   EXPO_PUBLIC_USE_MOCK=false
   ```

3. `http://localhost:8081`을 한 번 열고, 개발자도구(F12) 콘솔에서 기기 키 확인

   ```js
   localStorage.getItem('meokgo.deviceKey')
   ```

4. PowerShell에서 닉네임 등록 → 방 생성 → 투표 시작 (`$key`만 바꿔서 실행)

   ```powershell
   $key = "여기에_기기키"
   $h = @{ "X-Device-Key" = $key }
   $base = "http://localhost:8080/api/v1"
   Invoke-RestMethod -Method Post -Uri "$base/users/me/nickname" -Headers $h -ContentType "application/json" -Body '{"nickname":"tester"}' | Out-Null
   $room = Invoke-RestMethod -Method Post -Uri "$base/rooms" -Headers $h -ContentType "application/json" -Body '{"region_id":1,"schedule_type":"MEAL","drinking_option":"NONE"}'
   $roomId = $room.data.room_id
   Invoke-RestMethod -Method Post -Uri "$base/rooms/$roomId/vote/start" -Headers $h | Out-Null
   "방 번호: $roomId  →  http://localhost:8081/rooms/$roomId/vote"
   ```

5. 출력된 주소로 접속 (방 번호가 1이 아닐 수 있음)

| 화면에 뜨는 오류 | 원인 |
| --- | --- |
| 탐험방을 찾을 수 없습니다 (`ROOM-001`) | BE에 그 번호의 방이 없음 (BE 재시작 등) → 4번 다시 실행 |
| 이 탐험방의 참여자가 아니에요 (`PARTICIPANT-001`) | 방을 만든 기기 키와 브라우저의 기기 키가 다름 (다른 브라우저 / 시크릿 창) |

더미 모드로 돌아가려면 `.env.local`을 지우고 `npx expo start`를 다시 실행합니다.

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
| `voteApi.ts` | FE2 — 후보 조회(미생성 시 생성 후 재조회), 투표 저장 / 수정(POST / PUT), 투표 현황, 방 상태 |

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

- 구현 완료: 07 퀘스트 투표, 09 투표 대기. 나머지 FE2 화면은 임시 화면(`ScreenPlaceholder`)입니다.
- 08 투표 현황(방장)은 BE 투표 현황·마감 API 구현 후 `vote-status`에 추가 예정입니다.
- FE1 → FE2 연결: 06 참여 대기에서 `` router.replace(`/rooms/${roomId}/vote`) ``

### 07 퀘스트 투표 / 09 투표 대기 동작

- 07: 후보 6개 중 1~3개 선택 (0개면 버튼 비활성, 3개 선택 후 추가 선택은 반응 없음). 이미 투표했다면 기존 선택을 복원하고, 제출 시 덮어씁니다.
- 09: 화면 진입 시 1회 + 5초 간격으로 투표 현황과 방 상태를 조회합니다. 앱이 백그라운드로 가면 폴링을 멈춥니다.
- 09: 방 상태가 `VOTE_CLOSED` / `QUEST_CONFIRMED`면 10 퀘스트 확정, `IN_PROGRESS`면 11 탐험 진행 중으로 자동 이동합니다.
- 09의 참여자별 투표 상태는 BE `GET /votes/status` 미구현으로 **더미**입니다. 구현되면 `voteApi.ts`의 `VOTE_STATUS_API_PENDING`을 `false`로 바꿉니다.
- 방 상태는 임시로 `voteApi.ts`의 `fetchRoomStatus()`(`waiting-status` 사용)로 조회합니다. FE1의 `roomApi.ts`가 생기면 교체합니다.

## 공통 컴포넌트 · 훅

| 위치 | 역할 |
| --- | --- |
| `components/common/PrimaryButton.tsx` | 기본 CTA (353 x 52, radius 14). `variant="filled" \| "outline"`, `disabled`, `loading` |
| `components/common/NavHeader.tsx` | 뒤로가기 + 중앙 타이틀 (Bold 17). `onBack` 없으면 `router.back()` |
| `components/common/LogoHeader.tsx` | 로고 + 큰 타이틀 (24) + 안내 문구 |
| `components/common/CheckCircle.tsx` | 체크 원 (26px, 미선택 테두리 1.5px) |
| `components/common/Avatar.tsx` | 닉네임 첫 글자 아바타. 배경색 = 첫 글자 유니코드 % 6 → `PROFILE_PALETTE` |
| `hooks/usePolling.ts` | 5초 폴링. 백그라운드에서 중단, 복귀 시 재개, 이전 요청 완료 전 중복 요청 없음 |
| `constants/colors.ts` | 개발 가이드 컬러 토큰 + `PROFILE_PALETTE` (6색) |

화면 값은 `src/constants/`의 토큰을 사용하고, 공통 컴포넌트를 새로 만들 때는 팀 채팅방에 이름을 먼저 공유합니다.

### FE1 참고

- 기존 `homeApi.ts`, `nicknameApi.ts`를 `client.ts` / `mock.ts` 구조로 옮겨주세요.
- `(tabs)/_layout.tsx`(하단 탭)와 `home.tsx`의 `(tabs)` 이동은 FE1 담당입니다.
- 템플릿에서 남은 기존 오류 2건: `src/components/app-tabs.web.tsx`(삭제된 `/explore` 참조, tsc), `src/hooks/use-color-scheme.web.ts`(lint)

## BE 연동 메모

2026-11-03 로컬 BE(`local-h2` 프로필)와 연동 확인: 닉네임 등록, 지역 조회, 방 생성, 대기 상태, 투표 시작, 후보 생성 / 조회, 투표 저장 / 수정, 오류 응답(`COMMON-001`, `ROOM-001`) 정상.

07 / 09 화면으로 확인: 후보 미생성(`QUEST-002`) 시 생성 후 재조회, 첫 투표 POST, 수정 PUT, 기존 선택 복원, `waiting-status` 5초 폴링 정상.

- BE 미구현으로 FE에서 더미 처리 중: `GET /votes/status`
- BE 미구현이라 08 / 08-1 화면 보류: `GET /votes/close-preview`, `POST /votes/close`
- 투표 마감 API가 없어 09 → 10 자동 이동은 미확인

- CORS: FE 웹 개발 서버는 `http://localhost:8081` (BE 기본 허용 목록에 포함)
- 확인 요청 사항
  - `/api/v1/health`도 `X-Device-Key` 없으면 400 반환
  - 검증 오류의 `errors[].field`가 camelCase(`candidateIds`)로 내려옴 (요청 / 응답은 snake_case)
  - 방장으로 `VOTING` 중인 방이 있어도 `bootstrap`이 `has_active_room: false` 반환
