# 먹으러GO FE

친구와 퀘스트를 고르고 함께 외식하며 새로운 동네를 탐험하는 앱의 프론트엔드입니다.

- 스택: Expo SDK 57, Expo Router, React Native 0.86, TypeScript
- 통합 브랜치: `FE` (작업은 `feat/<담당>-<기능>` 브랜치 → PR → `FE`에 머지)
- 상세 협업 규칙: [`reference/FE 협업 규칙.md`](reference/FE%20협업%20규칙.md)

## 참고 문서 (`reference/`)

| 문서 | 내용 |
| --- | --- |
| [`기능명세서.md`](reference/기능명세서.md) | Notion 기능명세서 사본. 기능 69개, 담당(FE1 / FE2 / BE), 우선순위, 기한 (화면 번호는 디자인 이전 번호) |
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
더미 모드에서는 **방 번호가 홀수면 방장, 짝수면 참가자**로 동작합니다.
(03 조건 선택에서 만든 방, 06 초대 링크로 참여한 방은 번호와 관계없이 실제 역할을 따릅니다)

- 02 홈: `http://localhost:8081/home` — 상단 테스트 탭(탐험없음 / 탐험중 / 투표중)으로 02-1 / 02 / 02-2 전환 (개발 모드 + 더미일 때만 표시)
- 03 → 05 → 07 → 09: `/condition`에서 방 만들기 → 초대장 → 참여 대기(친구가 5초마다 1명씩 참여) → 퀘스트 선택 시작 → 퀘스트 투표
- 06 친구 참여 링크 (`src/api/roomApi.ts`의 `mockRooms`)

  | 주소 | 상황 |
  | --- | --- |
  | `/join/A2F8` | 참여 가능 → 08 참여 대기(참가자), 약 15초 뒤 방장 미접속 → 07-1 방장 권한 이어받기. 닉네임 `서연` 입력 시 06-2 |
  | `/join/STARTED` | 06-1 참여 마감 (투표 시작됨) |
  | `/join/FINISHED` | 06-1 참여 마감 (종료된 탐험) |
  | `/join/FULL` | 06-1 참여 마감 (정원 초과) |

- 09 퀘스트 투표: `http://localhost:8081/rooms/1/vote`
- 09-1 투표 현황(방장): `http://localhost:8081/rooms/1/vote-status`
- 10 투표 대기(참가자): `http://localhost:8081/rooms/2/vote-status`
- 10-1 퀘스트 확정 (방 번호 100 이상은 투표 마감 상태에서 시작)

  | 주소 | 상황 |
  | --- | --- |
  | `/rooms/101/confirm` | 방장 · 동점 없음 → 자동 확정 |
  | `/rooms/103/confirm` | 방장 · 동점 있음 → 동점 후보 선택 |
  | `/rooms/102/confirm` | 참가자 · 방장 확정 대기 |
  | `/rooms/104/confirm` | 참가자 · 확정 완료, 탐험 시작 대기 |

- 09-1에서 마감하면 10-1 → 탐험 시작하기 → 10-2까지 이어서 확인할 수 있습니다. (더미 방 상태는 새로고침하면 초기화)
- 10-2 퀘스트 진행 → 18 탐험 종료

  | 주소 | 상황 |
  | --- | --- |
  | `/rooms/101/progress` | 방장 · 3개 모두 완료하면 탐험 종료하기 활성 → 18 |
  | `/rooms/102/progress` | 참가자 · 3개 모두 완료하고 약 8초 뒤 방장이 종료한 것으로 처리 → 다음 폴링에서 18 자동 이동 (10~20초) |
  | `/rooms/101/finish` | 18 탐험 종료 (10-2에서 종료한 뒤에만 기록 보러가기 활성) |

- 11 ~ 15 내 기록 · 탐험 기록 (`src/api/recordApi.ts` 더미)

  | 주소 | 상황 |
  | --- | --- |
  | `/records` | 11 내 기록 · 기록 4개 (망원 / 성수 / 행궁 / 문래). 상단 테스트 버튼으로 14 빈 상태 전환 (개발 모드 + 더미일 때만 표시) |
  | `/records` → 연필 아이콘 | 12 닉네임 변경 → 저장 시 13 변경 완료 토스트 |
  | `/records/4` | 15 탐험 기록 (망원동) |
  | `/records/1101` | 15 탐험 기록 · 디자인 시안(을지로). 10-2 → 18에서 종료한 방의 기록 번호는 `1000 + 방 번호` |
  | `/records/1101/story` | 16 스토리 템플릿 선택 (기록 사진 4장으로 채워진 상태) |
  | `/records/1101/preview` | 17 기록 미리보기 (16을 거치지 않으면 01 MOOD + 기록 사진 앞 4장) |

- 11의 닉네임은 01 닉네임 설정에서 기기에 저장한 값입니다. 주소로 바로 열어 저장된 값이 없으면 비어 보입니다. (웹: 콘솔에서 `localStorage.setItem('user.nickname', '민교')`)
- 10-2에서 탐험을 종료하면 11 기록 목록 맨 앞에 을지로 기록이 추가됩니다. (새로고침하면 초기화)

- 방 번호 규칙은 `src/api/mockRooms.ts`에 있습니다.

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
| `apiError.ts` | FE1 — `ApiError`(= `client.ts`와 같은 클래스), 더미 헬퍼 `mockResponse` / `mockError`, 실서버 응답을 `{ success, data }`로 감싸는 `toResponse` |
| `nicknameApi.ts` | FE1 — 닉네임 최초 설정 (`POST /users/me/nickname`) |
| `homeApi.ts` | FE1 — 홈 (`GET /home`, BE 미구현 → `HOME_API_PENDING`) |
| `regionApi.ts` | FE1 — 지역 검색·분류, 최근 선택 지역 |
| `roomApi.ts` | FE1 — 방 생성, 대기 상태, 방 상세(BE 미구현), 투표 시작, 방장 이어받기(BE 미구현) |
| `inviteApi.ts` | FE1 — 초대 정보 조회, 초대 링크 참여 |
| `voteApi.ts` | FE2 — 후보 조회(미생성 시 생성 후 재조회), 투표 저장 / 수정(POST / PUT), 투표 현황, 방 상태 |
| `explorationApi.ts` | FE2 — 탐험 시작, 진행 조회, 퀘스트 완료 / 취소, 탐험 종료 (BE 미구현 → `EXPLORATION_API_PENDING`) |
| `recordApi.ts` | FE2 — 사용자 통계, 기록 목록 / 상세 (BE 미구현 → `RECORD_API_PENDING`). 더미 사진(`mock://…`)은 `getPhotoSource()`로 `assets/images/mock/` 이미지로 바꿈 |
| `storyApi.ts` | FE2 — Story 템플릿, 기록 사진 업로드(multipart, 1 ~ 4장) (BE 미구현 → `STORY_API_PENDING`) |
| `userApi.ts` | 닉네임 변경 (`PATCH /users/me/nickname`, FE2). bootstrap / 닉네임 최초 설정은 FE1이 `nicknameApi.ts`에서 옮길 예정 |
| `mockRooms.ts` | 더미 전용 — 화면 사이 방 상태 / 방장 여부 공유 (FE1 더미 방도 여기에 기록) |

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
- FE1 API(`homeApi` ~ `inviteApi`)는 FE1 화면 그대로 `{ success, data }`를 반환합니다. 더미 / 실서버 전환은 FE2 API와 같이 `USE_MOCK.<도메인>`과 `*_API_PENDING` 값으로 합니다.

## 라우트

라우트 파일(`src/app/`)은 주소의 ID만 꺼내 화면(`src/screens/`)에 넘깁니다.
화면 번호와 이름은 [Figma `먹 디자인`](https://www.figma.com/design/2JyLuF8Hjp9m2iQLUcTZWO/) 프레임 이름 기준입니다. 기능명세서의 이전 번호와의 대조표는 [`FE 협업 규칙.md`](reference/FE%20협업%20규칙.md) 2장에 있습니다.

| 주소 | 화면 | 담당 |
| --- | --- | --- |
| `/` | 00 앱 진입화면 | FE1 |
| `/nickname` | 01 닉네임 설정 | FE1 |
| `/home` | 02 / 02-1 / 02-2 홈 | FE1 |
| `/condition` | 03 조건 선택 (04 지역 선택은 바텀시트) | FE1 |
| `/room-created` | 05 초대장 | FE1 |
| `/join/:token` | 06 친구 참여 링크 접속 / 06-2 닉네임 중복 | FE1 |
| `/join-closed` | 06-1 참여 마감 | FE1 |
| `/waiting/:roomId` | 07 참여 대기(방장) / 07-1 방장 권한 이어받기 / 08 참여 대기(참가자) | FE1 |
| `/rooms/:roomId/vote` | 09 퀘스트 투표 | FE2 |
| `/rooms/:roomId/vote-status` | 09-1 투표 현황(방장) / 10 투표 대기 | FE2 |
| `/rooms/:roomId/confirm` | 10-1 퀘스트 확정 | FE2 |
| `/rooms/:roomId/progress` | 10-2 퀘스트 진행 | FE2 |
| `/rooms/:roomId/finish` | 18 탐험 종료 | FE2 |
| `/records` | 11 내 기록 (12 닉네임 변경 / 13 변경 완료 / 14 빈 상태, `(tabs)` 그룹) | FE2 |
| `/records/:recordId` | 15 탐험 기록 | FE2 |
| `/records/:recordId/story` | 16 스토리 템플릿 선택 | FE2 |
| `/records/:recordId/preview` | 17 기록 미리보기 | FE2 |

- FE1 화면(00 ~ 08)은 `FE1` 브랜치(`2605774`)를 통합한 것입니다. `FE1` 브랜치 자체는 원본으로 남겨 둡니다.
- 구현 완료: 00 ~ 08 전체(FE1), 09 퀘스트 투표, 09-1 투표 현황(방장), 09-2 투표 마감 확인, 10 투표 대기, 10-1 퀘스트 확정, 10-2 퀘스트 진행, 11 ~ 14 내 기록, 15 탐험 기록, 16 스토리 템플릿 선택, 17 기록 미리보기, 18 탐험 종료. FE2 화면은 모두 구현했습니다.
- FE1 → FE2 연결 (협업 규칙 2장 연결 지점 표)
  - 07 퀘스트 선택 시작 / 08에서 `VOTING` 감지 → `` router.replace(`/rooms/${roomId}/vote`) ``
  - 02 홈 이어하기 / 투표 현황 보기 → 방 상태별 이동 (`WAITING` → 대기, `VOTING` → `vote-status`, `VOTE_CLOSED` · `QUEST_CONFIRMED` → `confirm`, `IN_PROGRESS` → `progress`)
  - 02 홈 최근 탐험 카드 → `` `/records/${recordId}` ``
  - 하단 탭(`components/BottomTabBar.tsx`): 홈 → `/home`, 탐험 → `/condition`, 내 기록 → `/records`. 02 홈, 11 내 기록, 15 탐험 기록에서 사용 (`(tabs)/_layout.tsx`는 아직 없음)

### 09 ~ 10 투표 화면 동작

- 09: 후보 6개 중 1~3개 선택 (0개면 버튼 비활성, 3개 선택 후 추가 선택은 반응 없음). 이미 투표했다면 기존 선택을 복원하고, 제출 시 덮어씁니다.
- 09-1 / 10: 같은 주소(`vote-status`)에서 `waiting-status`의 `is_host`로 방장이면 09-1, 아니면 10을 보여줍니다.
- 09-1 / 10: 화면 진입 시 1회 + 5초 간격으로 투표 현황과 방 상태를 조회합니다. 앱이 백그라운드로 가면 폴링을 멈춥니다.
- 09-1: 퀘스트별 득표 막대(득표가 있는 퀘스트만, 막대 길이 = 득표수 / 전체 인원). 득표 합계가 0이면 마감 버튼 비활성.
- 09-2: 마감하기 → 확인창(미투표 인원, 현재 득표 1위) → 마감 후 10-1 퀘스트 확정으로 이동. 취소·딤 영역을 누르면 닫힘.
- 10: 방 상태가 `VOTE_CLOSED` / `QUEST_CONFIRMED`면 10-1 퀘스트 확정, `IN_PROGRESS`면 10-2 퀘스트 진행으로 자동 이동합니다.
- BE 미구현으로 **더미**인 API: 투표 현황(`VOTE_STATUS_API_PENDING`), 마감 확인·마감(`VOTE_CLOSE_API_PENDING`). 구현되면 `voteApi.ts`의 해당 값을 `false`로 바꿉니다.
- 방 상태 / 방장 여부는 `voteApi.ts`의 `fetchRoomState()`(`waiting-status` 사용)로 조회합니다. (FE1 `roomApi.ts`의 `fetchWaitingStatus()`와 같은 API)

### 10-1 퀘스트 확정 동작

- 방장: 화면 진입 시 `GET /final-quests/preview` → 동점 없으면 `POST /final-quests` 자동 호출 → 확정된 퀘스트 3개 표시
- 방장 · 동점: 동점 그룹마다 `required_select_count`개 선택 → `POST /final-quests/tie-break` → `POST /final-quests`
- 방장: 탐험 시작하기 → `POST /exploration/start` → 10-2 퀘스트 진행
- 참가자: 방장이 확정할 때까지 대기 → 확정된 퀘스트 표시 → 방장이 탐험을 시작하면(`IN_PROGRESS`) 10-2로 자동 이동
- 화면 진입 시 1회 + 5초 간격으로 방 상태를 확인합니다.
- 동점 후보 선택 화면은 디자인 시안이 없어 09 퀘스트 투표 목록과 같은 모양으로 만들었습니다.
- 탐험 요약 카드의 날짜는 API에 날짜 필드가 없어 기기의 오늘 날짜로 표시합니다.

### 10-2 퀘스트 진행 · 18 탐험 종료 동작

- 10-2: 체크 원을 누르면 `PATCH /final-quests/{id}/progress`로 완료 / 완료 취소. 화면은 먼저 바꾸고, 실패하면 되돌린 뒤 오류 문구를 표시합니다.
- 10-2: 순서와 관계없이 완료할 수 있고, 화면 진입 시 1회 + 5초 간격으로 `GET /exploration/progress`와 방 상태를 조회합니다. (완료 요청 중에는 폴링 결과로 덮어쓰지 않음)
- 10-2: 방장은 3개를 모두 완료하면 탐험 종료하기 활성 → `POST /exploration/finish` → 18. 참가자는 버튼 없이 안내 문구만 보이고, `FINISHED`를 감지하면 18로 자동 이동합니다.
- 18: `GET /exploration/progress`로 요약(지역 / 인원 / 완료 퀘스트 수)을 다시 조회하고, 탐험 기록 보러가기 → `/records/{record_id}`.
- 10-2 / 18의 날짜는 API에 날짜 필드가 없어 기기의 오늘 날짜, 대표 참여자 닉네임은 `GET /rooms/{id}`(더미)에서 가져옵니다.

### 11 ~ 15 내 기록 · 탐험 기록 동작

- 11: 화면에 들어올 때마다 `GET /users/me/statistics`, `GET /users/me/records`를 다시 조회합니다. 카드 → `/records/{record_id}`.
- 14: 기록이 0개면 안내 블록 + 새로운 탐험 시작 카드 → `/condition`.
- 12: 연필 아이콘 → 바텀시트(기존 닉네임 채움). 한글·영문·숫자만, 10자 초과 입력은 무시(01과 같은 `utils/nickname.ts`), `n/10`은 10자면 코랄. 기존 닉네임과 같거나 비어 있으면 저장 비활성. 시트 밖 탭 / 뒤로가기로 닫기.
- 13: 저장 성공(`PATCH /users/me/nickname`) 시 기기 저장 닉네임도 바꾸고, 프로필 글자·색을 다시 계산한 뒤 체크 아이콘 토스트 2초. 실패 시 같은 자리에 오류 토스트.
- 15: `GET /records/{id}`. 첫 번째 사진은 대표 사진, 나머지는 그날의 사진(가로 스크롤). 사진을 누르면 원본 크게 보기(화면 탭으로 닫기). 기록 남기기 → `/records/{id}/story`. 하단 탭의 내 기록을 누르면 11로 돌아갑니다.

### 16 ~ 17 기록 남기기 동작

- 16: `GET /story-templates`와 기록 상세로 시작. 사진 4칸(지역 / 음식 / 함께한 / 추가)은 기록 사진으로 채워 두고, 칸을 누르면 갤러리(`expo-image-picker`)에서 교체, X로 비우기. JPG / PNG, 장당 10MB 이하만 받습니다.
- 16: 템플릿 썸네일은 고른 사진으로 바로 다시 그립니다. 0장이면 미리보기 비활성.
- 16 → 17: 새로 고른 사진만 `POST /records/{id}/photos`로 올리고, 템플릿 · 사진 선택은 `utils/storyDraft.ts`(메모리)에 기록별로 둡니다 (주소에는 `record_id`만, 협업 규칙 4.1).
- 17: `components/story/StoryCard.tsx`로 9:16 이미지를 그리고(빈 칸 제외, 지역명 · 날짜 · 완료 퀘스트 수 자동 삽입), `react-native-view-shot`으로 1080 x 1920 PNG를 캡처합니다.
  - 앱: `expo-media-library`로 사진 보관함에 저장(쓰기 권한만 요청), 공유하기 → `expo-sharing` 공유 시트
  - 웹: PNG 파일 다운로드, 공유하기는 숨김 (`expo-media-library` 웹 미지원, `expo-sharing`은 웹에서 로컬 파일 공유 불가) — `utils/saveStoryImage.ts` / `.web.ts`로 나눔
- 4개 패키지 모두 Expo Go에 포함되어 있어 개발 빌드 없이 확인할 수 있습니다. 권한 문구는 `app.json` 플러그인 설정에 있습니다.
- 앱(Expo Go) 실기기에서의 갤러리 선택 · 저장 · 공유는 아직 확인하지 않았습니다. 웹에서는 템플릿 전환, 사진 비우기, 미리보기 이동, PNG 생성(1080 x 1920)까지 확인했습니다.

### 결정 사항

| 항목 | 결정 | 근거 |
| --- | --- | --- |
| 최종 퀘스트 동점 처리 | **재투표 없이 방장이 동점 후보 중 직접 선택** (`POST /final-quests/tie-break`) | API명세서가 최신 기준. 기능명세서의 "먼저 투표된 퀘스트 → 후보 표시 순서로 자동 선정"은 적용하지 않음 |
| 동점 없을 때 확정 시점 | 방장이 10-1 화면에 들어오면 자동 확정 | 디자인처럼 확정 결과가 바로 보이도록 |
| 탐험 시작 권한 | 방장만 시작, 참가자는 자동 이동 | 07 투표 시작, 09-1 투표 마감과 같은 방식 |

## FE2 컨펌 필요 사항

디자인·명세에 정해져 있지 않아 FE2가 임시로 정해 구현한 항목입니다. 확정되면 이 표에서 지우고 위 결정 사항으로 옮깁니다.

| 항목 | 현재 구현 | 확인 대상 |
| --- | --- | --- |
| 탐험 종료 권한 (10-2) | 방장만 탐험 종료하기를 누를 수 있음. 참가자는 안내 문구 + `FINISHED` 감지 시 18로 자동 이동 | 기획, BE |
| 참가자의 기록 번호 (18) | `POST /exploration/finish` 응답의 `record_id`는 방장만 받음. 참가자가 18에서 기록으로 가려면 `GET /exploration/progress`에 `record_id` 필드가 필요해 더미에 추가함 | BE |
| 탐험 날짜 (10-2 / 18) | 진행 조회 응답에 날짜가 없어 기기의 오늘 날짜로 표시 | BE |
| 종료 후 완료 변경 오류 코드 | 명세에 전용 코드가 없어 더미는 `ROOM-002`로 응답 | BE |
| 기록 카드 대표 사진 (11) | `GET /users/me/records`에 사진 필드가 없어 `thumbnail_url`을 더미에 추가함 | BE |
| 기록 남기기 버튼 위치 (15) | 화면정의에는 "기록 남기기 → 16"이 있으나 디자인 시안에 버튼이 없어 완료한 퀘스트 아래에 둠 | 디자인 |
| 대표 사진 (15) | 명세에 대표 사진 필드가 없어 `photos`의 첫 번째 사진을 대표 사진으로 사용. 사진이 없으면 회색 영역 | 디자인, BE |
| 내 기록 닉네임 (11) | 사용자 정보 조회 API가 `bootstrap`뿐이라 기기에 저장된 닉네임을 표시 | BE |
| 기록 이미지 생성 위치 (17) | 앱에서 템플릿을 그려 캡처해 저장 / 공유. 서버 `POST / GET /records/{id}/story-image`는 사용하지 않음 (보관 30일 정책도 미적용) | 기획, BE |
| 템플릿 ↔ 레이아웃 (16 / 17) | 템플릿 API에 레이아웃 구분 값이 없어 `template_id` 1 → MOOD, 2 → 콜라주로 고정 (`StoryCard.getStoryLayout`) | BE |
| 공유 버튼 (17) | 화면정의에는 저장 / 공유 버튼이 있으나 디자인 시안에는 이미지 저장만 있어, 저장 아래에 공유하기 글자 버튼을 둠 (앱에서만) | 디자인 |
| 사진 1080px 리사이즈 (16) | 앱에서는 리사이즈하지 않고 원본(품질 0.9)을 올림. 서버에서 리사이즈하는지 확인 필요 | BE |
| 사진 칸 비우기 (16) | 디자인에 없어 사진 오른쪽 위 X 버튼으로 비우기를 추가 (빈 칸은 템플릿에서 제외 규칙용) | 디자인 |
| 기록 이미지 문구 (17) | 디자인은 지역명만 있으나, 화면정의의 "날짜 / 완료 퀘스트 자동 삽입"에 따라 지역명 아래 날짜 · 퀘스트 수를 추가 | 디자인 |

## 공통 컴포넌트 · 훅

| 위치 | 역할 |
| --- | --- |
FE1과 겹치던 컴포넌트(헤더, 아바타)는 FE1 것으로 통일했습니다.

| 위치 | 역할 |
| --- | --- |
| `components/ScreenHeader.tsx` | FE1 — `LogoHeader`(로고 + 큰 타이틀 26, `subtitle` 선택), `NavHeader`(중앙 타이틀 Bold 17, `onBack` 있을 때만 뒤로가기) |
| `components/ProfileAvatar.tsx` | FE1 — 닉네임 첫 글자 아바타. 배경색 = 첫 글자 유니코드 % 6 → `PROFILE_PALETTE`. `size`는 px (필요하면 `scale()` 적용해서 전달) |
| `components/Toast.tsx` | FE1 — `useToast()` → `{ showToast, toast }`. `showToast(text, { icon: "check" })`는 pill + 코랄 체크 원 (13 변경 완료) |
| `components/BottomTabBar.tsx` | 하단 알약 탭바 (02 홈에서 분리). `active="home" \| "explore" \| "records"`, `activeNavigable`(하위 화면에서 현재 탭을 눌러 목록으로 돌아가기). 화면 아래쪽에 약 120 여백 필요 |
| `components/InviteLinkSection.tsx` | FE1 — 초대 링크 복사·공유 (05, 07) |
| `components/RegionSelectSheet.tsx` | FE1 — 04 지역 선택 바텀시트 |
| `components/common/PrimaryButton.tsx` | 기본 CTA (353 x 52, radius 14). `variant="filled" \| "outline"`, `disabled`, `loading` |
| `components/common/CheckCircle.tsx` | 체크 원 (26px, 미선택 테두리 1.5px) |
| `components/common/ConfirmDialog.tsx` | 확인창 (딤 + 모달, 취소 / 확인). `children`으로 추가 정보 표시 |
| `components/story/StoryCard.tsx` | FE2 — 기록 이미지 템플릿 (01 MOOD / 02 콜라주). 16 썸네일과 17 미리보기 · 캡처에 같이 사용, 크기에 비례해 그림 |
| `utils/storyDraft.ts` | FE2 — 16 → 17 템플릿 · 사진 선택 상태 (메모리) |
| `utils/saveStoryImage.ts` | FE2 — 기록 이미지 캡처 후 저장 / 공유. 웹은 `.web.ts` (다운로드) |
| `utils/date.ts` | 날짜 표시 포맷 (`formatDotDate`: 2026. 09. 14, `formatCompactDotDate`: 2026.09.14) |
| `hooks/usePolling.ts` | 5초 폴링 (`export default`). 백그라운드에서 중단, 복귀 시 재개, 이전 요청 완료 전 중복 요청 없음 |
| `constants/colors.ts` | FE1 토큰 이름 기준 (`chipBorder`, `emptyCircleBorder`, `tabActiveBg` …) + `trackBg`, `dim`, `PROFILE_PALETTE` (6색) |

화면 값은 `src/constants/`의 토큰을 사용하고, 공통 컴포넌트를 새로 만들 때는 팀 채팅방에 이름을 먼저 공유합니다.

### FE1 참고

- FE1 API는 `client.ts` / `mock.ts`로 실서버 전환이 되도록 연결했습니다. `nicknameApi.ts` → `userApi.ts`(bootstrap, 닉네임 변경 포함) 정리는 남아 있습니다.
- `(tabs)/_layout.tsx`(하단 탭)와 `home.tsx`의 `(tabs)` 이동은 FE1 담당입니다. 그 전까지 02 홈의 탭바를 `components/BottomTabBar.tsx`로 분리해 FE2 화면(11, 15)과 함께 씁니다 (2026-11-03, FE2).
- 실서버 모드에서 BE가 꺼져 있으면 04 지역 선택 시트에서 처리되지 않은 오류가 납니다 (`RegionSelectSheet`의 조회에 `catch` 없음).
- 템플릿에서 남은 기존 오류 2건: `src/components/app-tabs.web.tsx`(삭제된 `/explore` 참조, tsc), `src/hooks/use-color-scheme.web.ts`(lint)

## BE 연동 메모

2026-11-03 로컬 BE(`local-h2` 프로필)와 연동 확인: 닉네임 등록, 지역 조회, 방 생성, 대기 상태, 투표 시작, 후보 생성 / 조회, 투표 저장 / 수정, 오류 응답(`COMMON-001`, `ROOM-001`) 정상.

09 / 10 화면으로 확인: 후보 미생성(`QUEST-002`) 시 생성 후 재조회, 첫 투표 POST, 수정 PUT, 기존 선택 복원, `waiting-status` 5초 폴링 정상.

09-1 / 10 화면으로 확인: 실제 `is_host` 값으로 방장(09-1) / 초대 참여자(10) 화면 분기 정상.

- BE 미구현으로 FE에서 더미 처리 중: `GET /home`, `GET /votes/status`, `GET /votes/close-preview`, `POST /votes/close`, `GET /rooms/{id}`, `POST /rooms/{id}/host/takeover`, `GET /final-quests/preview`, `POST /final-quests/tie-break`, `POST /final-quests`, `POST /exploration/start`, `GET /exploration/progress`, `PATCH /final-quests/{id}/progress`, `POST /exploration/finish`, `GET /users/me/statistics`, `GET /users/me/records`, `GET /records/{id}`, `GET /story-templates`, `POST /records/{id}/photos`
  - BE 작업분이 push되면 각 API 파일의 `*_API_PENDING`을 `false`로 바꿉니다.
- 지역 썸네일 (FE1 요청서: `region.image_url` 컬럼 추가) — FE 타입·화면은 준비 완료, 더미 값은 `null`(회색 기본 이미지)
  - `GET /home`: `recent_records[].thumbnail_url`, `popular_regions[].region_image_url`
  - `GET /regions`: `regions[].region_image_url`, `GET /users/me/recent-regions`: `recent_regions[].region_image_url`
- BE 구현과 FE1 화면이 다른 점
  - `GET /regions` 응답에 `region_level`이 없음 (BE `RegionItemResponse`) → 04 지역 선택 시트의 시·도 / 세부 지역 구분이 실서버에서 동작하지 않음
  - `GET /waiting-status`에 `invite_url` 없음 → 07 참여 대기의 초대 링크가 실서버에서 빈 값
  - 홈 `active_room.voted_participant_count`가 명세에 없음 (02-2 투표 진행 막대)
- 투표 마감 API가 없어 실제 마감 후 참가자 10 → 10-1 자동 이동은 미확인
- API명세서 보완 요청
  - 확정된 퀘스트 조회 API 없음 → 참가자·재진입한 방장이 확정 결과를 볼 수 없음 (FE는 `fetchFinalQuests()` 더미로 대기, 예: `GET /final-quests`)
  - 동점일 때 `preview`에 이미 확정된 순위가 없음 → "1·2위 확정 + 3위 선택"을 화면에 보여줄 수 없음
  - `GET /rooms/{id}`에 날짜 필드(`created_at` 등) 없음 → 탐험 요약 카드 날짜를 기기 날짜로 표시 중

- CORS: FE 웹 개발 서버는 `http://localhost:8081` (BE 기본 허용 목록에 포함)
- 확인 요청 사항
  - `/api/v1/health`도 `X-Device-Key` 없으면 400 반환
  - 검증 오류의 `errors[].field`가 camelCase(`candidateIds`)로 내려옴 (요청 / 응답은 snake_case)
  - 방장으로 `VOTING` 중인 방이 있어도 `bootstrap`이 `has_active_room: false` 반환
