# 먹으러GO FE 협업 규칙

> 작성 기준일: 2026-11-02 (수정: 2026-11-03 — 화면 번호를 Figma 프레임 기준으로 변경, FE1 브랜치 통합: 라우트·공통 컴포넌트·컬러 토큰은 FE1 기준)
>
> 기준 서비스: 먹으러GO
>
> 적용 대상: FE1, FE2
>
> 기술 스택: Expo SDK 57, Expo Router, React Native 0.86, TypeScript
>
> 저장소 / 통합 브랜치: `FE` 저장소 / `FE` 브랜치
>
> 작성자: FE2
>

> 목적: FE1과 FE2가 병렬로 작업할 때 겹치는 영역(API 모듈, 라우트, 공통 컴포넌트, 브랜치)을 미리 정해 충돌과 중복 구현을 막는다.

---

## 1. 참조 문서 확인

| 참조 문서 | 반영 내용 |
| --- | --- |
| [Figma `먹 디자인`](https://www.figma.com/design/2JyLuF8Hjp9m2iQLUcTZWO/) | **화면 번호와 화면 이름의 기준** — 프레임 이름 (`00. 앱 진입화면` ~ `18_탐험 종료`) |
| `먹으러고 기능명세서` (Notion) | 기능 69개, FE1 / FE2 / BE 담당 구분, 우선순위, 기한 (화면 번호는 이전 번호 → 2장 대조표 참고) |
| `API명세서.md` | Base URL, `X-Device-Key` 헤더, 공통 응답 / 오류 형식, Enum, 화면별 API 매핑, 폴링 주기 |
| `DB설계서.md` | 기기 기반 사용자 식별, 같은 기기 참여 복구, 상태값 관리 원칙 |
| `먹으러GO 개발 가이드.md` | 컬러 토큰, 프로필 팔레트, 타이포그래피, 컴포넌트 규격, 닉네임 / 사진 / 퀘스트 규칙 |
| 현재 `FE` 코드 | `src/app` 라우트 → `src/screens` 화면 분리 패턴, `src/api` 더미 API, `src/constants/colors.ts`, `src/utils/responsive.ts` |

---

## 2. 담당 범위

화면 번호와 이름은 Figma `먹 디자인`의 프레임 이름 기준, 담당은 기능명세서의 담당 컬럼 기준이다.

| 담당 | 화면 번호 | 화면 |
| --- | --- | --- |
| FE1 | 00 ~ 08 | 앱 진입화면, 닉네임 설정, 홈(진행 중인 탐험 있음 / 없음 / 투표 대기 중), 하단 내비게이션, 조건 선택, 지역 선택, 초대장, 친구 참여 링크 접속(참여 마감 / 닉네임 중복), 참여 대기(방장 / 방장 권한 이어받기 / 참가자) |
| FE2 | 09 ~ 18 | 퀘스트 투표, 투표 현황(방장), 투표 마감 확인, 투표 대기, 퀘스트 확정, 퀘스트 진행, 내 기록(닉네임 변경 / 변경 완료 / 빈 상태), 탐험 기록, 스토리 템플릿 선택, 기록 미리보기, 탐험 종료 |

### 화면 번호 대조표

기능명세서(Notion)는 디자인 이전 번호를 쓴다. 코드 주석, PR, 대화에서는 **디자인 번호**를 쓴다.

| 디자인 번호 · 이름 | 기능명세서 번호 · 이름 | 담당 |
| --- | --- | --- |
| 00 앱 진입화면 | 00 스플래시 | FE1 |
| 01 닉네임 설정 | 01 닉네임 설정 | FE1 |
| 02 홈 · 진행 중인 탐험 있음 | 02-1 홈 · 탐험 진행 중 | FE1 |
| 02-1 홈 · 진행 중인 탐험 없음 | 02-3 홈 · 탐험 없음 | FE1 |
| 02-2 홈 · 투표 대기 중 | 02-2 홈 · 투표 진행 중 | FE1 |
| (번호 없음) 하단 내비게이션 | 공통 · 하단 내비게이션 | FE1 |
| 03 조건 선택 | 03 오늘의 탐험 설정 | FE1 |
| 04 지역 선택 | 03-1 탐험 지역 선택 | FE1 |
| 05 초대장 | 04 탐험방 생성 완료 | FE1 |
| 06 친구 참여 링크 접속 | 05 초대 링크 참여 | FE1 |
| 06-1 참여 마감 | 05-1 참여 마감 | FE1 |
| 06-2 닉네임 중복 | 05-2 닉네임 중복 오류 | FE1 |
| 07 참여 대기(방장) | 06-1 참여 대기 · 방장 | FE1 |
| 07-1 방장 권한 이어받기 | 06-3 방장 미접속 / 방장 권한 이어받기 | FE1 |
| 08 참여 대기(참가자) | 06-2 참여 대기 · 참가자 | FE1 |
| 09 퀘스트 투표 | 07 퀘스트 투표 | FE2 |
| 09-1 투표 현황(방장) | 08 투표 현황 · 방장 | FE2 |
| 09-2 투표 마감 확인 | 08-1 투표 마감 확인 | FE2 |
| 10 투표 대기 | 09 투표 대기 | FE2 |
| 10-1 퀘스트 확정 | 10 퀘스트 확정 | FE2 |
| 10-2 퀘스트 진행 | 11 탐험 진행 중 | FE2 |
| 11 내기록1 | 13 내 기록 | FE2 |
| 12 내기록2 (닉네임 변경 시트) | 13-2 닉네임 변경 | FE2 |
| 13 내기록3 · 변경 완료 | 13-3 닉네임 변경 완료 | FE2 |
| 14 내기록4 · 진행한 탐험이 없을 때 | 13-1 내 기록 · 빈 상태 | FE2 |
| 15 탐험 기록 | 14 탐험 기록 상세 | FE2 |
| 16 스토리템플릿선택 | 15 기록 남기기 | FE2 |
| 17 기록 미리보기 | 16 기록 미리보기 | FE2 |
| 18 탐험 종료 | 12 탐험 종료 | FE2 |

### 화면 간 연결 지점

FE1 화면과 FE2 화면이 만나는 지점은 아래 표가 전부다. 이동 경로는 이 표를 기준으로 한다.

| 출발 (담당) | 도착 (담당) | 이동 방식 |
| --- | --- | --- |
| 07 참여 대기(방장) · 퀘스트 선택 시작 (FE1) | 09 퀘스트 투표 (FE2) | `` router.replace(`/rooms/${roomId}/vote`) `` |
| 08 참여 대기(참가자) · `VOTING` 감지 (FE1) | 09 퀘스트 투표 (FE2) | `` router.replace(`/rooms/${roomId}/vote`) `` |
| 02-2 홈 · 투표 대기 중 · 투표 현황 보기 (FE1) | 09-1 투표 현황 / 10 투표 대기 (FE2) | `` router.push(`/rooms/${roomId}/vote-status`) `` |
| 02 홈 · 진행 중인 탐험 있음 · 이어하기 (FE1) | 10-2 퀘스트 진행 (FE2) | `` router.push(`/rooms/${roomId}/progress`) `` |
| 02 / 02-2 홈 · 최근 탐험 카드 (FE1) | 15 탐험 기록 (FE2) | `` router.push(`/records/${recordId}`) `` |
| 14 내기록4 · 탐험 시작 (FE2) | 03 조건 선택 (FE1) | `router.push("/condition")` |
| 09-1 / 10-1 등 FE2 화면의 뒤로가기 (FE2) | 02 홈 (FE1) | `router.replace("/home")` |

- 연결 지점의 경로가 바뀌면 바꾸는 쪽이 상대에게 먼저 알린다.
- 02 홈의 이어하기는 방 상태에 따라 도착 화면이 달라진다. 4.3 표를 따른다.

---

## 3. API 공통 모듈

### 3.1 담당

- FE2가 먼저 만들어 `FE` 브랜치에 머지하고 공유한다.
- FE1은 머지 후 기존 `homeApi.ts`, `nicknameApi.ts`를 아래 구조로 옮긴다.
- (2026-11-03 FE1 통합) FE1 API는 `client.ts` / `mock.ts`로 실서버 전환되도록 연결했다. 단, FE1 화면이 쓰는 `{ success, data }` 반환 형태는 유지한다 (`apiError.ts`의 `toResponse`). `nicknameApi.ts` → `userApi.ts` 정리는 남아 있다.

### 3.2 파일 구조

```text
src/api/
  client.ts        // Base URL, 공통 헤더, 응답 / 오류 처리
  deviceKey.ts     // 기기 키 생성 및 저장
  mock.ts          // 더미 / 실서버 전환 플래그
  types.ts         // ApiResponse<T>, ApiError, 공통 Enum 타입
  userApi.ts       // FE1 — bootstrap, 닉네임
  homeApi.ts       // FE1 — 홈
  regionApi.ts     // FE1 — 지역, 최근 지역
  roomApi.ts       // FE1 — 방 생성, 대기 상태, 투표 시작, 방장 이어받기
  inviteApi.ts     // FE1 — 초대 조회, 참여
  voteApi.ts       // FE2 — 후보 조회, 투표 저장 / 수정, 투표 현황, 마감
  finalQuestApi.ts // FE2 — 확정 미리보기, 동점 선택, 확정
  explorationApi.ts// FE2 — 탐험 시작, 진행 조회, 완료 처리, 종료
  recordApi.ts     // FE2 — 통계, 기록 목록, 기록 상세
  storyApi.ts      // FE2 — 템플릿, 사진 업로드, Story 이미지
```

- 파일은 `API명세서.md`의 장(章) 단위로 나눈다.
- 다른 담당자의 API 파일은 수정하지 않는다. 필요하면 요청한다.

### 3.3 공통 규칙

| 항목 | 규칙 |
| --- | --- |
| Base URL | `/api/v1`. 서버 주소는 환경 변수 `EXPO_PUBLIC_API_URL`로 주입 (로컬 BE 기본 포트 `8080`) |
| 공통 헤더 | `X-Device-Key`, `Content-Type: application/json`, `Accept: application/json`. 파일 업로드만 `multipart/form-data` |
| 성공 응답 | `{ success: true, data }` 형식. 화면에는 `data`만 넘긴다 |
| 오류 응답 | `API명세서.md` 2.3 형식을 `ApiError`로 변환해 throw. 화면은 `code`(예: `PARTICIPANT-003`)로 분기 |
| 필드명 | 서버 응답 필드명(snake_case)을 타입에 그대로 사용한다. 화면에서 camelCase로 바꾸지 않는다 |
| 날짜 | 서버 값(ISO 8601, 예: `2026-10-06T01:30:00`)을 그대로 받고, 화면 표시용 포맷은 공통 유틸로 변환 |

### 3.4 기기 키

- 앱 최초 실행 시 UUID를 생성해 기기에 저장하고 이후 모든 요청의 `X-Device-Key`로 사용한다.
- 같은 기기 재접속 시 참여 상태 / 투표 복구가 이 값으로 동작하므로, 앱 삭제 전까지 바뀌면 안 된다.
- 저장용 라이브러리를 추가할 때는 `npx expo install <package>`로 설치한다.

### 3.5 더미 API

- BE가 아직 구현하지 않은 API는 더미로 먼저 개발한다.
- 더미 응답은 `API명세서.md`의 응답 예시와 **구조·필드명을 동일하게** 만든다. BE 완성 후 내부 구현만 교체한다.
- `mock.ts`의 플래그로 API별 더미 / 실서버를 전환한다.
- 화면 안에 테스트용 상태 전환 UI를 둘 경우 개발 모드(`__DEV__`)에서만 보이게 한다.

---

## 4. 라우트 구조

### 4.1 원칙

- Expo Router 파일 기반 라우팅을 사용한다. 경로는 `src/app/`에만 둔다.
- 라우트 파일은 화면 컴포넌트를 불러오기만 하고, 실제 화면은 `src/screens/`에 둔다. (현재 코드 패턴 유지)
- 하단 탭(홈 · 탐험 · 내 기록)은 `(tabs)` 그룹으로 묶는다. (FE1이 하단 탭을 구현할 때 `home.tsx`를 옮겨도 주소 `/home`은 유지한다)
- FE1 화면(00 ~ 08)은 FE1 구현 경로를 따른다. FE2 탐험방 흐름은 `rooms/[roomId]/`, 기록 흐름은 `records/[recordId]/` 아래에 둔다.
- 화면 이동 시 `room_id`, `record_id` 외의 데이터는 파라미터로 넘기지 않고 화면에서 API로 다시 조회한다.

### 4.2 경로 목록

```text
src/app/
  _layout.tsx               // 루트 Stack                                         공통
  index.tsx                 // 00 앱 진입화면                                     FE1
  nickname.tsx              // 01 닉네임 설정                                     FE1
  home.tsx                  // 02 / 02-1 / 02-2 홈                                FE1
  condition.tsx             // 03 조건 선택 (04 지역 선택은 바텀시트)             FE1
  room-created.tsx          // 05 초대장                                          FE1
  join/
    [token].tsx             // 06 친구 참여 링크 접속 (06-2 닉네임 중복 포함)     FE1
  join-closed.tsx           // 06-1 참여 마감                                     FE1
  waiting/
    [roomId].tsx            // 07 참여 대기(방장) / 07-1 / 08 참여 대기(참가자)   FE1
  (tabs)/
    _layout.tsx             // 하단 내비게이션 (미구현)                           FE1
    records/
      index.tsx             // 11 내 기록 (12 / 13 / 14 포함)                     FE2
  rooms/
    [roomId]/
      vote.tsx              // 09 퀘스트 투표                                     FE2
      vote-status.tsx       // 09-1 투표 현황(방장) / 10 투표 대기                FE2
      confirm.tsx           // 10-1 퀘스트 확정                                   FE2
      progress.tsx          // 10-2 퀘스트 진행                                   FE2
      finish.tsx            // 18 탐험 종료                                       FE2
  records/
    [recordId]/
      index.tsx             // 15 탐험 기록                                       FE2
      story.tsx             // 16 스토리 템플릿 선택                              FE2
      preview.tsx           // 17 기록 미리보기                                   FE2
```

- 바텀시트·확인창·토스트(04 지역 선택, 06-2 닉네임 중복, 07-1 방장 권한 이어받기, 09-2 투표 마감 확인, 12 닉네임 변경, 13 변경 완료)는 별도 경로를 만들지 않고 해당 화면 안의 컴포넌트로 구현한다. 06-1 참여 마감은 FE1 구현대로 별도 경로(`/join-closed`)를 쓴다.
- 경로 추가 / 변경은 담당 폴더 안에서는 자유롭게 하고, 4.2 목록과 2장의 연결 지점 표를 함께 수정한다.

### 4.3 방 상태별 화면 분기

방 상태 값은 BE 구현(`RoomStatus`)과 `API명세서.md` 2.5를 따른다.

| `room_status` | 이동할 화면 |
| --- | --- |
| `WAITING` | `waiting/[roomId]` |
| `VOTING` | `rooms/[roomId]/vote` (미투표) 또는 `vote-status` (투표 완료) |
| `VOTE_CLOSED` | `rooms/[roomId]/confirm` |
| `QUEST_CONFIRMED` | `rooms/[roomId]/confirm` |
| `IN_PROGRESS` | `rooms/[roomId]/progress` |
| `FINISHED` | `records/[recordId]` |
| `EXPIRED` | 홈으로 이동 후 안내 |

- `먹으러GO 개발 가이드.md` 10장의 상태값(`CONFIRMED`, `DONE`, `CANCELED`)은 BE 구현과 다르다. **FE는 위 표(BE 기준)를 따른다.**
- 문자열을 화면마다 직접 쓰지 않고 `src/api/types.ts`의 타입을 사용한다.

---

## 5. 공통 컴포넌트와 디자인 토큰

### 5.1 담당 원칙

- 공통 컴포넌트는 **먼저 필요한 사람이 만든다.**
- 만들기 전에 팀 채팅방에 컴포넌트 이름을 먼저 알려 중복을 막는다.
- 이미 있는 공통 컴포넌트를 수정할 때는 다른 사용처가 깨지지 않게 props를 추가하는 방식으로 바꾼다.

### 5.2 위치와 예상 목록

FE1과 FE2가 각각 만든 같은 역할의 컴포넌트는 **FE1 것으로 통일**했다 (2026-11-03).

```text
src/components/
  ScreenHeader.tsx    // FE1 — LogoHeader(로고 + 타이틀, subtitle 선택), NavHeader(중앙 타이틀 Bold 17 + 뒤로가기)
  ProfileAvatar.tsx   // FE1 — 닉네임 첫 1자, (첫 글자 유니코드 % 6) 프로필 팔레트
  Toast.tsx           // FE1 — 배경 #1F1F22, 2초 노출 (useToast)
src/components/common/
  PrimaryButton.tsx   // 기본 CTA 353 x 52, radius 14, 비활성 #F2F2F2 / 글자 #A5A5A5
  ConfirmDialog.tsx   // 확인창 (투표 마감 확인 등)
  BottomSheet.tsx     // 바텀시트 (닉네임 변경 등)
  CheckCircle.tsx     // 26px, 미선택 테두리 1.5px #D4D4D4
  Chip.tsx            // 선택 pill, radius 999
src/constants/
  colors.ts           // 개발 가이드 1장 컬러 토큰 + 2장 프로필 팔레트 (토큰 이름은 FE1 기준)
  typography.ts       // 개발 가이드 3장 타이포그래피
  layout.ts           // 개발 가이드 4장 레이아웃 그리드, 5장 그림자
src/hooks/
  usePolling.ts       // 5초 폴링 (07 / 08 참여 대기, 09-1 투표 현황 / 10 투표 대기)
src/utils/
  responsive.ts       // 기존 유지
  date.ts             // 날짜 표시 포맷
```

- 화면 전용 컴포넌트는 `src/components/<화면명>/`에 둔다.
- 색상, 크기, 그림자 값은 화면에 직접 쓰지 않고 `src/constants/`의 토큰을 사용한다.
- 토큰 값은 `먹으러GO 개발 가이드.md`를 기준으로 한다. 가이드와 다른 값이 필요하면 가이드부터 수정한다.

---

## 6. 브랜치와 커밋

### 6.1 브랜치 전략

```text
main
 └─ FE                         // FE 통합 브랜치
     ├─ feat/fe2-api-client
     ├─ feat/fe2-vote          // 09, 10
     ├─ feat/fe2-records       // 11, 15
     ├─ feat/fe1-region        // 04
     └─ ...
```

| 항목 | 규칙 |
| --- | --- |
| 기준 브랜치 | 작업 브랜치는 항상 최신 `FE`에서 만든다 |
| 브랜치 이름 | `feat/<담당>-<기능>`, 수정은 `fix/<담당>-<기능>` (예: `feat/fe2-vote`, `fix/fe1-home`) |
| PR 단위 | PR 1개 = 화면 1~2개 또는 공통 모듈 1개 |
| 리뷰 | 상호 리뷰 없이 작성자가 직접 `FE`에 머지한다 |
| 공통 파일 수정 | PR 제목에 `[공통]`을 붙이고 팀 채팅방에 알린다 |
| `FE` 직접 커밋 | 금지. 모든 변경은 작업 브랜치 → PR → 머지 |

### 6.2 공통 파일

아래 파일을 수정한 PR은 `[공통]` 표시 대상이다. 머지 후 상대방은 `FE`를 다시 받아 작업 브랜치에 반영한다.

- `src/app/_layout.tsx`, `src/app/(tabs)/_layout.tsx`
- `src/api/client.ts`, `deviceKey.ts`, `mock.ts`, `types.ts`
- `src/constants/*`, `src/components/common/*`, `src/hooks/*`, `src/utils/*`
- `app.json`, `package.json`

### 6.3 커밋 메시지

현재 저장소 형식을 따른다.

```text
<type>: <한글 요약>

feat: 퀘스트 투표 화면 UI 및 투표 저장 API 연동
fix: 홈 화면 최근 탐험 날짜 포맷 수정
refactor: 공통 버튼 컴포넌트 분리
chore: API 클라이언트 환경 변수 추가
```

### 6.4 기타

- 패키지는 `npx expo install <package>`로만 추가하고, 추가 시 PR에 이유를 적는다.
- `ios/`, `android/` 폴더는 만들거나 커밋하지 않는다.

---

## 7. 추후 협의 필요 항목

| 항목 | 내용 | 협의 대상 |
| --- | --- | --- |
| 지역 썸네일 | `region.image_url` 추가 요청 (FE1 요청서). FE는 `thumbnail_url` / `region_image_url` 타입·화면 준비 완료, 더미는 `null` | FE1, BE |
| 지역 / 대기 응답 필드 | BE `GET /regions`에 `region_level` 없음(04 시·도 구분 불가), `waiting-status`에 `invite_url` 없음(07 초대 링크) | FE1, BE |
| 기능명세서 화면 번호 | Notion 기능명세서와 `reference/기능명세서.md`가 디자인 이전 번호를 씀 (2장 대조표). 원본을 디자인 번호로 바꿀지 결정 | FE1, FE2, 기획 |
| 방 상태값 불일치 | 개발 가이드 10장과 API명세서 / BE 구현의 `room_status` 값이 다름. 개발 가이드 수정 필요 | FE1, FE2, BE, 기획 |
| 홈 응답 필드 | FE 홈 화면은 `voted_participant_count`를 사용하나 API명세서 `GET /home` 응답에는 없음. `retention` 필드는 FE에 미반영 | FE1, BE |
| 개발 서버 주소 | 실기기 테스트 시 BE 접속 주소(로컬 IP / 배포 서버) 결정 | FE1, FE2, BE |
| 폰트 적용 | Noto Sans KR / Inter 로딩 방식과 담당 | FE1, FE2 |
| Story 네이티브 모듈 | 앨범 접근, 이미지 생성, 저장·공유에 필요한 모듈과 개발 빌드 여부 | FE2 |
