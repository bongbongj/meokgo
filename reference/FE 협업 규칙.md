# 먹으러GO FE 협업 규칙

> 작성 기준일: 2026-11-02
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
| `먹으러고 기능명세서` (Notion) | 기능 69개, FE1 / FE2 / BE 담당 구분, 화면 번호, 우선순위, 기한 |
| `API명세서.md` | Base URL, `X-Device-Key` 헤더, 공통 응답 / 오류 형식, Enum, 화면별 API 매핑, 폴링 주기 |
| `DB설계서.md` | 기기 기반 사용자 식별, 같은 기기 참여 복구, 상태값 관리 원칙 |
| `먹으러GO 개발 가이드.md` | 컬러 토큰, 프로필 팔레트, 타이포그래피, 컴포넌트 규격, 닉네임 / 사진 / 퀘스트 규칙 |
| 현재 `FE` 코드 | `src/app` 라우트 → `src/screens` 화면 분리 패턴, `src/api` 더미 API, `src/constants/colors.ts`, `src/utils/responsive.ts` |

---

## 2. 담당 범위

기능명세서의 담당 컬럼 기준이다.

| 담당 | 화면 번호 | 화면 |
| --- | --- | --- |
| FE1 | 00 ~ 06 | 스플래시, 닉네임 설정, 홈, 하단 내비게이션, 탐험 지역 선택, 오늘의 탐험 설정, 탐험방 생성 완료, 초대 링크 참여, 참여 대기(방장 / 참가자 / 방장 미접속) |
| FE2 | 07 ~ 16 | 퀘스트 투표, 투표 현황, 투표 마감 확인, 투표 대기, 퀘스트 확정, 탐험 진행 중, 탐험 종료, 내 기록, 닉네임 변경, 탐험 기록 상세, 기록 남기기, 기록 미리보기 |

### 화면 간 연결 지점

FE1 화면과 FE2 화면이 만나는 지점은 아래 네 곳뿐이다. 이동 경로는 이 표를 기준으로 한다.

| 출발 (담당) | 도착 (담당) | 이동 방식 |
| --- | --- | --- |
| 06 참여 대기 (FE1) | 07 퀘스트 투표 (FE2) | `` router.replace(`/rooms/${roomId}/vote`) `` |
| 02 홈 · 투표 진행 중 (FE1) | 08 / 09 투표 현황·대기 (FE2) | `` router.push(`/rooms/${roomId}/vote-status`) `` |
| 02 홈 · 탐험 진행 중 (FE1) | 11 탐험 진행 중 (FE2) | `` router.push(`/rooms/${roomId}/progress`) `` |
| 02 홈 · 최근 탐험 (FE1) | 14 탐험 기록 상세 (FE2) | `` router.push(`/records/${recordId}`) `` |

- 연결 지점의 경로가 바뀌면 바꾸는 쪽이 상대에게 먼저 알린다.
- 13 내 기록 → 03 탐험 설정(빈 상태의 탐험 시작 버튼)은 FE2가 FE1 경로로 이동한다.

---

## 3. API 공통 모듈

### 3.1 담당

- FE2가 먼저 만들어 `FE` 브랜치에 머지하고 공유한다.
- FE1은 머지 후 기존 `homeApi.ts`, `nicknameApi.ts`를 아래 구조로 옮긴다.

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
- 하단 탭(홈 · 탐험 · 내 기록)은 `(tabs)` 그룹으로 묶는다.
- 탐험방 흐름은 `rooms/[roomId]/`, 기록 흐름은 `records/[recordId]/` 아래에 둔다.
- 화면 이동 시 `room_id`, `record_id` 외의 데이터는 파라미터로 넘기지 않고 화면에서 API로 다시 조회한다.

### 4.2 경로 목록

```text
src/app/
  _layout.tsx               // 루트 Stack                       공통
  index.tsx                 // 00 스플래시                      FE1
  nickname.tsx              // 01 닉네임 설정                   FE1
  (tabs)/
    _layout.tsx             // 하단 내비게이션                  FE1
    home.tsx                // 02 홈                            FE1
    explore/
      index.tsx             // 03 오늘의 탐험 설정              FE1
      region.tsx            // 03-1 탐험 지역 선택              FE1
    records/
      index.tsx             // 13 내 기록                       FE2
  invite/
    [token].tsx             // 05 초대 링크 참여                FE1
  rooms/
    [roomId]/
      created.tsx           // 04 탐험방 생성 완료              FE1
      waiting.tsx           // 06 참여 대기                     FE1
      vote.tsx              // 07 퀘스트 투표                   FE2
      vote-status.tsx       // 08 투표 현황 / 09 투표 대기      FE2
      confirm.tsx           // 10 퀘스트 확정                   FE2
      progress.tsx          // 11 탐험 진행 중                  FE2
      finish.tsx            // 12 탐험 종료                     FE2
  records/
    [recordId]/
      index.tsx             // 14 탐험 기록 상세                FE2
      story.tsx             // 15 기록 남기기                   FE2
      preview.tsx           // 16 기록 미리보기                 FE2
```

- 바텀시트·확인창·토스트(05-1, 05-2, 06-3, 08-1, 13-2, 13-3)는 별도 경로를 만들지 않고 해당 화면 안의 컴포넌트로 구현한다.
- 경로 추가 / 변경은 담당 폴더 안에서는 자유롭게 하고, 4.2 목록과 2장의 연결 지점 표를 함께 수정한다.

### 4.3 방 상태별 화면 분기

방 상태 값은 BE 구현(`RoomStatus`)과 `API명세서.md` 2.5를 따른다.

| `room_status` | 이동할 화면 |
| --- | --- |
| `WAITING` | `rooms/[roomId]/waiting` |
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

```text
src/components/common/
  PrimaryButton.tsx   // 기본 CTA 353 x 52, radius 14, 비활성 #F2F2F2 / 글자 #A5A5A5
  NavHeader.tsx       // 중앙 타이틀 Bold 17 + 뒤로가기
  Avatar.tsx          // 닉네임 첫 1자, (첫 글자 유니코드 % 6) 프로필 팔레트
  Toast.tsx           // 배경 #1F1F22, 2초 노출
  ConfirmDialog.tsx   // 확인창 (투표 마감 확인 등)
  BottomSheet.tsx     // 바텀시트 (닉네임 변경 등)
  CheckCircle.tsx     // 26px, 미선택 테두리 1.5px #D4D4D4
  Chip.tsx            // 선택 pill, radius 999
src/constants/
  colors.ts           // 개발 가이드 1장 컬러 토큰 + 2장 프로필 팔레트
  typography.ts       // 개발 가이드 3장 타이포그래피
  layout.ts           // 개발 가이드 4장 레이아웃 그리드, 5장 그림자
src/hooks/
  usePolling.ts       // 5초 폴링 (06 참여 대기, 08 / 09 투표 현황)
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
     ├─ feat/fe2-vote          // 07, 09
     ├─ feat/fe2-records       // 13, 14
     ├─ feat/fe1-region        // 03-1
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
| 방 상태값 불일치 | 개발 가이드 10장과 API명세서 / BE 구현의 `room_status` 값이 다름. 개발 가이드 수정 필요 | FE1, FE2, BE, 기획 |
| 홈 응답 필드 | FE 홈 화면은 `voted_participant_count`를 사용하나 API명세서 `GET /home` 응답에는 없음. `retention` 필드는 FE에 미반영 | FE1, BE |
| 개발 서버 주소 | 실기기 테스트 시 BE 접속 주소(로컬 IP / 배포 서버) 결정 | FE1, FE2, BE |
| 폰트 적용 | Noto Sans KR / Inter 로딩 방식과 담당 | FE1, FE2 |
| Story 네이티브 모듈 | 앨범 접근, 이미지 생성, 저장·공유에 필요한 모듈과 개발 빌드 여부 | FE2 |
