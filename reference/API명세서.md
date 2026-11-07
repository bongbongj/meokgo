# 먹으러GO API 명세서

> 작성 기준일: 2026-10-06
>
> 최종 수정일: 2026-11-07
>
> 기준 서비스: 먹으러GO
>
> Base URL: `/api/v1`
>
> 서버: 단일 Spring Boot 서버 기준
>
> DB: MySQL 8.0, `meokgo_db`
>
> 인증: MVP 기준 별도 로그인 없이 `X-Device-Key` 헤더로 기기 기반 사용자 식별
>
> 작성자: 정효림

---

## 1. 참조 문서 확인

본 API 명세서는 `reference` 폴더 내 DB 설계 파일과 사용자가 제공한 기획 자료의 일치 여부를 확인하여 작성했다.

| 참조 파일 | 반영 내용 |
| --- | --- |
| `reference/DB설계서.md` | `device_user`, `region`, `exploration_room`, `room_participant`, `quest`, `vote`, `final_quest`, `exploration_record`, `story_image` 등 테이블 구조와 API 매핑 검증 |
| `추민교_먹으러GO_발표.pdf` | 조건 설정, 링크 기반 참여, 6개 퀘스트 투표, 3개 확정, 완료 버튼 중심 수행, Story 선택 제작, MVP 범위 반영 |
| 기능명세서 스크린샷 | 스플래시, 닉네임 설정, 홈, 탐험 설정, 탐험방 생성, 참여 대기, 투표, 탐험 진행, 내 기록, 기록 남기기 화면 API 반영 |
| 추가 정책 회의 내용 | 같은 기기 참여 복구, 닉네임 중복 방지, 후보 부족 처리, 투표 마감 확인, 동점 방장 선택, 푸시 알림 제외 반영 |
| 사용자 구현 방향 정정(2026-10-31) | 여러 지역 중 하나를 직접 선택하고, 지역별 구분 없이 공통 퀘스트 DB에서 일정·음주 여부·기피 음식 등의 조건으로 후보를 선정하는 구조 반영 |
| 사용자 조건 정책 확정(2026-10-31) | 기피 음식 자유 입력, 예산 기능 제외, 비음주 시 음주 필수 퀘스트 제외, 미완료 우선·완료 이력 후보 보충 및 그룹 내 무작위 선정 반영 |
| 기피 음식·완료 이력 세부 정책 확정(2026-10-31) | 자유 입력을 표준 키워드·동의어 사전으로 해석하고 인식 결과를 확인·수정하며, 후보 생성 시점 현재 참여자 전체의 완료 경험자 수가 적은 그룹부터 무작위 선정 |
| 기피 음식 응답 단순화(2026-10-31) | 기피 키워드만 응답·저장하며, 허용 표현은 서버 내부의 오인 방지에만 사용 |

---

## 2. 공통 규칙

### 2.1 공통 요청 헤더

MVP에서는 회원 로그인 없이 기기 기반 사용자 식별을 사용한다.

| 헤더 | 필수 | 설명 |
| --- | --- | --- |
| `X-Device-Key` | O | 기기 기반 사용자 식별 키 |
| `Content-Type` | O | `application/json` |
| `Accept` | O | `application/json` |

파일 업로드 API는 `Content-Type`에 `multipart/form-data`를 사용한다.

### 2.2 공통 성공 응답

```json
{
  "success": true,
  "data": {}
}
```

메시지만 반환하는 경우는 다음 형식을 사용한다.

```json
{
  "success": true,
  "message": "요청이 처리되었습니다."
}
```

### 2.3 공통 오류 응답

오류 응답은 아래 공용 에러 응답 JSON 형식을 따른다.

```json
{
  "timestamp": "2026-10-06T10:30:00.000000",
  "status": 400,
  "code": "COMMON-001",
  "message": "입력값이 올바르지 않습니다.",
  "errors": [
    {
      "field": "nickname",
      "value": "",
      "reason": "닉네임은 필수 입력값입니다."
    }
  ],
  "path": "/api/v1/users/me/nickname"
}
```

### 2.4 공통 오류 코드

| 코드 | HTTP 상태 | 설명 |
| --- | --- | --- |
| `COMMON-001` | 400 | 입력값 검증 실패 |
| `COMMON-002` | 400 | 지원하지 않는 요청 값 |
| `USER-001` | 404 | 사용자를 찾을 수 없음 |
| `USER-002` | 400 | 닉네임 형식 오류 |
| `REGION-001` | 404 | 지역을 찾을 수 없음 |
| `ROOM-001` | 404 | 탐험방을 찾을 수 없음 |
| `ROOM-002` | 409 | 이미 투표 또는 탐험이 시작된 방 |
| `ROOM-003` | 409 | 참여할 수 없는 방 |
| `ROOM-004` | 403 | 방장 권한 없음 |
| `ROOM-005` | 409 | 방장 권한 이어받기 가능 시간이 아님 |
| `INVITE-001` | 400 | 잘못된 초대 링크 |
| `INVITE-002` | 410 | 만료된 초대 링크 |
| `PARTICIPANT-001` | 404 | 참여자를 찾을 수 없음 |
| `PARTICIPANT-002` | 409 | 정원 초과 |
| `PARTICIPANT-003` | 409 | 같은 탐험방 내 닉네임 중복 |
| `QUEST-001` | 404 | 퀘스트를 찾을 수 없음 |
| `QUEST-002` | 409 | 후보 퀘스트가 아직 생성되지 않음 |
| `QUEST-003` | 400 | 후보 퀘스트 3개 미만으로 조건 재설정 필요 |
| `VOTE-001` | 409 | 이미 마감된 투표 |
| `VOTE-002` | 400 | 투표 선택 개수 오류 |
| `VOTE-003` | 400 | 투표 마감 확인값 누락 |
| `VOTE-004` | 409 | MVP에서 투표 재오픈 미지원 |
| `FINAL-001` | 409 | 동점 후보 방장 선택 필요 |
| `RECORD-001` | 404 | 탐험 기록을 찾을 수 없음 |
| `STORY-001` | 400 | Story 제작을 선택하지 않음 |
| `FILE-001` | 400 | 업로드 파일 형식 또는 개수 오류 |

### 2.5 주요 Enum

| 이름 | 값 |
| --- | --- |
| `schedule_type` | `MEAL`, `CAFE`, `PUB`, `SECOND_ROUND` |
| `time_slot` | `LUNCH`, `DINNER`, `LATE_NIGHT`, `ANY` |
| `drinking_option` | `NONE`, `AVAILABLE`, `ANY` |
| `room_status` | `WAITING`, `VOTING`, `VOTE_CLOSED`, `QUEST_CONFIRMED`, `IN_PROGRESS`, `FINISHED`, `EXPIRED` |
| `participant_role` | `HOST`, `MEMBER` |
| `participant_status` | `WAITING`, `VOTING`, `READY`, `EXPLORING`, `FINISHED`, `LEFT` |
| `quest_type` | `COMMON`, `COOPERATIVE`, `TRANSITION`, `REVISIT` |
| `vote_status` | `OPEN`, `CLOSED` |
| `final_quest_selection_reason` | `VOTE_RANK`, `HOST_TIE_BREAK` |
| `progress_status` | `TODO`, `DONE`, `CANCELED` |
| `retention_stage` | `FIRST_DISCOVERY`, `ALLEY_EXPLORER`, `REGION_MASTER` |
| `invite_unjoinable_reason` | `EXPIRED`, `ALREADY_STARTED`, `FULL`, `INVALID_LINK`, `FINISHED` |

**Note**

- `X-Device-Key`는 같은 기기 재접속 시 참여 상태와 투표 내역 복구에 사용한다.
- 다른 기기에서 기존 참여 내역을 복구하는 기능은 MVP에서 제외한다.
- 푸시 알림은 MVP에서 제외하며, 투표 상태는 앱 내부 문구로 표시한다.
- 퀘스트 완료는 사진, GPS, 영수증 인증 없이 완료 버튼으로 처리한다.
- MVP 실시간 갱신은 HTTP 폴링으로 처리한다.
- 방장 권한 이어받기 버튼은 방장의 마지막 진행 액션 이후 5분이 지나면 활성화한다.
- 초대 링크는 생성 후 24시간 동안 유효하다.
- 탐험방은 생성 후 24시간이 지나면 만료 처리한다. 미종료 방은 조회 시 만료를 반영하고 기본 60초 주기로 DB 상태를 갱신한다. 종료된 방은 만료 대상에서 제외한다.
- Story 이미지는 가능하면 S3에 저장하고, 초기 개발 상황에 따라 서버 로컬 저장을 허용한다.
- Story 이미지와 Story 제작용 사진의 보관 기간은 생성 후 30일이다.
- 사용자는 등록된 여러 활성 지역 중 탐험할 지역 하나를 직접 선택한다. 운영 지역을 홍대·성수·망원 3개로 한정하지 않는다.
- 지역은 탐험 장소 표시, 최근 선택 지역, 탐험 기록 및 지역 통계에 사용하며 퀘스트 후보 필터링에는 사용하지 않는다.
- 모든 퀘스트는 지역별 구분 없는 공통 DB에서 관리하고, 일정·시간대·음주 여부·기피 음식 등의 조건으로 후보를 선정한다.
- 기피 음식은 사용자가 자유 입력하며, 예산 선택·입력·후보 필터링 기능은 제공하지 않는다.
- 조건을 통과한 미완료 퀘스트를 우선 무작위 선정하고, 6개에 미달하면 조건을 통과한 완료 이력 퀘스트로 보충한다.

---

## 3. User API

### GET `/api/v1/users/me/bootstrap`

**Summary:** 앱 실행 정보 조회

**Description:** 스플래시 화면에서 최초 실행 여부, 닉네임, 진행 중인 탐험방, 같은 기기 기준 참여 복구 가능 여부를 조회한다.

**Responses**

`200 OK`

```json
{
  "success": true,
  "data": {
    "user_id": 1,
    "nickname": "효림",
    "first_launch": false,
    "has_active_room": true,
    "active_room_id": 10,
    "active_participant_id": 1,
    "restored_by_device": true,
    "vote_restored": true
  }
}
```

**Note**

- 진행 중인 탐험방이 있으면 홈 화면에서 해당 탐험방으로 복귀할 수 있다.
- 같은 기기에서 이전 참여 정보가 있으면 `restored_by_device = true`를 반환한다.
- 복구할 방은 참여 일시와 참여자 ID가 가장 최근인 활성 참여를 선택한다. 이탈 참여자, 종료·만료된 방과 유효 시간이 지난 방은 제외한다.
- `vote_restored`는 선택된 참여자의 실제 투표 제출 여부를 반환한다.

---

### POST `/api/v1/users/me/nickname`

**Summary:** 닉네임 최초 설정

**Description:** 로그인 없이 사용할 닉네임을 저장하고 최초 실행 여부를 갱신한다.

**Request Body**

| 필드 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| `nickname` | string | O | 1~10자 닉네임 |

요청 예시:

```json
{
  "nickname": "효림"
}
```

**Responses**

`200 OK`

```json
{
  "success": true,
  "data": {
    "user_id": 1,
    "nickname": "효림",
    "first_launch": false
  }
}
```

---

### PATCH `/api/v1/users/me/nickname`

**Summary:** 닉네임 변경

**Description:** 내 기록 화면 또는 설정 바텀시트에서 사용자 기본 닉네임을 변경한다.

**Request Body**

| 필드 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| `nickname` | string | O | 변경할 1~10자 닉네임 |

**Responses**

`200 OK`

```json
{
  "success": true,
  "data": {
    "user_id": 1,
    "nickname": "먹고수"
  }
}
```

---

## 4. Home API

### GET `/api/v1/home`

**Summary:** 홈 화면 조회

**Description:** 현재 상태에 따라 진행 중 탐험, 투표 진행, 탐험 없음 화면을 구분하여 표시한다. 최근 탐험과 인기 지역도 함께 조회한다.

**Responses**

`200 OK`

```json
{
  "success": true,
  "data": {
    "active_room": {
      "room_id": 10,
      "room_status": "WAITING",
      "region_name": "홍대",
      "participant_count": 4,
      "completed_quest_count": 0,
      "total_quest_count": 3
    },
    "recent_records": [
      {
        "record_id": 3,
        "region_name": "성수",
        "completed_quest_count": 3,
        "created_at": "2026-10-06T01:30:00",
        "thumbnail_url": null
      }
    ],
    "popular_regions": [
      {
        "region_id": 1,
        "region_name": "홍대",
        "exploration_count": 12,
        "region_image_url": null
      }
    ],
    "retention": {
      "current_stage_name": "첫 발견",
      "next_stage_name": "골목 탐험가",
      "next_condition": "다른 날 같은 지역을 다시 탐험하면 새 퀘스트 세트가 열립니다."
    }
  }
}
```

**지역 대표 이미지 정책**

- `recent_records[].thumbnail_url`은 현재 해당 기록 지역의 `region.image_url`을 반환한다. 추후 썸네일 선정 정책을 변경하더라도 응답 필드명은 유지한다.
- `popular_regions[].region_image_url`은 해당 지역의 대표 이미지 URL이다.
- 이미지가 없는 경우 필드를 생략하거나 빈 문자열을 반환하지 않고 `null`을 반환한다. 앱은 회색 기본 이미지를 표시한다.
- 등록 주소는 500자 이내의 HTTPS 절대 URL이다. 사진은 4:3 비율·가로 800픽셀 이상·JPG 또는 WebP·장당 300KB 이하를 권장하며 원형 자르기는 앱에서 처리한다.
- 지역 대표 이미지는 모든 등록 지역에 적용할 수 있으며 개인 사진·스토리의 30일 만료 정리 대상에 포함하지 않는다.

---

## 5. Region API

### GET `/api/v1/regions`

**Summary:** 지역 검색 및 분류 조회

**Description:** 등록된 활성 지역 중 검색어와 일치하는 지역 또는 상위 지역에 속한 하위 지역 목록을 조회한다. 사용자는 여러 지역 중 탐험할 지역 하나를 직접 선택한다.

**Query Parameters**

| 이름 | 필수 | 설명 |
| --- | --- | --- |
| `keyword` | X | 지역 검색어 |
| `parent_region_id` | X | 상위 지역 ID |

**Responses**

`200 OK`

```json
{
  "success": true,
  "data": {
    "regions": [
      {
        "region_id": 1,
        "region_name": "홍대",
        "region_level": "DISTRICT",
        "parent_region_id": null,
        "region_image_url": null
      },
      {
        "region_id": 2,
        "region_name": "성수",
        "region_level": "DISTRICT",
        "parent_region_id": null,
        "region_image_url": null
      },
      {
        "region_id": 3,
        "region_name": "망원",
        "region_level": "DISTRICT",
        "parent_region_id": null,
        "region_image_url": null
      }
    ]
  }
}
```

**Note**

- 응답의 `홍대`, `성수`, `망원`은 지역 데이터 예시이며, 운영 지역 목록을 이 3개로 제한하지 않는다.
- 실제 선택지는 `region`에 등록된 활성 지역을 기준으로 제공한다.
- `regions[].region_image_url`은 지역 대표 이미지의 HTTPS 절대 URL이며 미등록이면 필드를 유지한 채 `null`을 반환한다.
- 지역을 추가할 때 지역별 퀘스트를 별도로 등록할 필요가 없다. 모든 지역에서 같은 공통 퀘스트 DB를 사용한다.

---

### GET `/api/v1/users/me/recent-regions`

**Summary:** 최근 선택 지역 조회

**Description:** 사용자가 최근 선택한 지역을 빠른 선택 영역에 표시한다.

**Responses**

`200 OK`

```json
{
  "success": true,
  "data": {
    "recent_regions": [
      {
        "region_id": 1,
        "region_name": "홍대",
        "selected_at": "2026-10-06T01:00:00",
        "region_image_url": null
      }
    ]
  }
}
```

**Note**

- `recent_regions[].region_image_url`은 해당 지역의 대표 이미지 URL이다. 미등록이면 필드를 유지한 채 `null`을 반환한다.

---

## 6. Room API

### POST `/api/v1/food-preferences/preview`

**요약:** 자유 입력 기피 음식 해석 결과 미리보기

**설명:** 사용자가 입력한 기피 음식 원문을 표준 키워드·동의어 사전으로 해석한다. 방 생성 전 인식된 기피 항목과 확인이 필요한 표현을 표시하고 자유 입력 내용을 수정할 수 있게 한다. 이 요청은 탐험방을 생성하지 않는다.

**요청 본문**

| 필드 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| `avoid_foods` | string | X | 최대 500자의 자유 입력 원문. 생략·빈 문자열은 기피 음식 없음 |

**요청 예시**

```json
{
  "avoid_foods": "고수, 매운 음식"
}
```

**성공 응답 예시**

```json
{
  "success": true,
  "data": {
    "avoid_foods": "고수, 매운 음식",
    "recognized_avoid_keywords": ["고수", "매운맛"],
    "unresolved_expressions": [],
    "needs_review": false,
    "dictionary_version": "1"
  }
}
```

**처리 규칙**

- 자유 입력 원문을 보존하고, 매칭용 문자열에만 유니코드 표기·영문 대소문자·연속 공백 정리를 적용한다.
- 운영자가 관리하는 사전에서 표준 키워드와 동의어를 연결한다. 예: `매운 음식`, `매운 거` → `매운맛`.
- 넓은 음식 분류와 하위 항목 관계를 관리한다. 예: `해산물` 기피는 그 하위 항목으로 등록된 재료를 필수로 요구하는 퀘스트와 충돌한다. 하위 항목 기피를 상위 분류 전체 기피로 확대하지 않는다.
- 단순 문자열 포함 여부만으로 기피 여부를 판단하지 않는다. `못 먹어요`, `싫어요`, `피하고 싶어요` 등 기피 표현과 `괜찮아요` 등 허용 표현의 적용 대상을 구분한다. 문맥 없는 음식 나열은 기피 항목으로 해석한다.
- 같은 항목에 대한 허용·기피 표현이 충돌하거나 문맥이 모호하거나 사전으로 해석하지 못한 표현은 `unresolved_expressions`에 반환하고 `needs_review = true`로 표시한다. 추측하여 확정하거나 조용히 누락하지 않는다.
- 클라이언트는 인식한 기피 항목과 미해석 표현을 보여주고 원문을 수정하여 다시 확인할 수 있게 한다. 자유 입력을 선택 항목 UI로 대체하지 않는다.
- 방 생성 요청에서도 서버가 같은 해석을 다시 수행한다. 미해석·모호한 표현이 남으면 `COMMON-001` 오류의 `errors`에 `avoid_foods` 필드와 수정 안내를 반환한다. 원문을 수정한 후 다시 요청한다.
- 허용 표현은 서버 내부에서 기피 음식 오인을 방지하는 데만 사용한다. API 응답과 DB에는 별도 허용 키워드 항목을 두지 않으며, 다른 필터링 조건도 변경하지 않는다.

---

### POST `/api/v1/rooms`

**Summary:** 탐험방 생성

**Description:** 사용자가 직접 선택한 탐험 지역과 일정, 시간대, 음주 여부, 기피 음식 등의 조건을 저장하여 새로운 탐험방을 생성한다. 생성자는 방장이 된다. 지역은 탐험 장소 정보이며, 퀘스트 후보는 지역과 무관하게 나머지 조건으로 선정한다.

**Request Body**

| 필드 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| `region_id` | number | O | 지역 목록에서 사용자가 직접 선택한 탐험 지역 ID. 퀘스트 필터링에는 사용하지 않음 |
| `schedule_type` | string | O | `MEAL`, `CAFE`, `PUB`, `SECOND_ROUND` |
| `time_slot` | string | X | `LUNCH`, `DINNER`, `LATE_NIGHT`, `ANY` |
| `drinking_option` | string | O | `NONE`: 음주 안 함, `AVAILABLE`: 음주 가능, `ANY`: 무관 |
| `avoid_foods` | string | X | 사용자가 자유 입력한 기피 음식 문자열. 미리 정의된 선택 항목이나 코드 목록을 사용하지 않음 |

요청 예시:

```json
{
  "region_id": 1,
  "schedule_type": "MEAL",
  "time_slot": "DINNER",
  "drinking_option": "ANY",
  "avoid_foods": "매운 음식"
}
```

**Responses**

`201 Created`

```json
{
  "success": true,
  "data": {
    "room_id": 10,
    "room_code": "MGO123",
    "room_status": "WAITING",
    "max_participant_count": 4,
    "invite_url": "https://meokgo.app/invite/abc123",
    "participant": {
      "participant_id": 1,
      "role": "HOST"
    }
  }
}
```

**Note**

- 방장이 앱을 종료해도 탐험방은 유지된다.
- MVP 권장 인원은 2~4명이다.
- `avoid_foods`는 자유 입력 원문을 문자열로 전달한다. 선택 항목 ID나 음식 코드 배열로 전달하지 않는다. 방 생성 전 기피 음식 해석 미리보기로 인식 결과를 확인·수정할 수 있으며, 서버는 방 생성 시 원문과 확정된 해석 결과·사전 버전을 함께 저장한다.
- 예산 선택 기능은 없으며, 요청·응답 및 후보 선정 조건에 예산 필드를 포함하지 않는다.
- `drinking_option = NONE`이면 음주가 필수인 퀘스트를 제외한다. `AVAILABLE`과 `ANY`는 비음주 퀘스트를 제외하지 않으며 음주·비음주 퀘스트를 모두 허용한다. 다른 조건은 계속 적용한다.

---

### GET `/api/v1/rooms/{room_id}`

**Summary:** 탐험방 상세 조회

**Description:** 탐험방 지역, 조건, 참여자, 현재 상태를 조회한다.

**구현 규칙**

- 현재 참여자만 조회할 수 있으며 이탈자는 제외한다. 조회 시 본인의 접속 시간을 갱신한다.
- 유효 시간이 지난 미종료 방은 `EXPIRED`로 반환하고 저장한다. 종료된 방의 `FINISHED` 상태는 유지한다.

**Responses**

`200 OK`

```json
{
  "success": true,
  "data": {
    "room_id": 10,
    "room_status": "WAITING",
    "region_name": "홍대",
    "condition": {
      "schedule_type": "MEAL",
      "time_slot": "DINNER",
      "drinking_option": "ANY",
      "avoid_foods": "매운 음식"
    },
    "participants": [
      {
        "participant_id": 1,
        "nickname": "효림",
        "role": "HOST",
        "status": "WAITING",
        "connected": true
      }
    ]
  }
}
```

---

### GET `/api/v1/rooms/{room_id}/participants/me`

**Summary:** 내 참여 상태 복구 조회

**Description:** 같은 기기에서 재접속한 사용자의 기존 참여 상태와 투표 내역을 복구한다.

**Responses**

`200 OK`

```json
{
  "success": true,
  "data": {
    "room_id": 10,
    "participant_id": 2,
    "nickname": "민수",
    "room_status": "VOTING",
    "participant_status": "VOTING",
    "restored_by_device": true,
    "voted": true,
    "voted_candidate_ids": [1, 2, 3]
  }
}
```

**Note**

- 다른 기기에서 기존 참여 상태를 복구하는 기능은 MVP에서 제공하지 않는다.
- 투표·탐험 시작 이후에도 같은 기기의 기존 참여 상태와 선택한 후보 ID를 복구한다. 이탈자는 복구하지 않는다.
- 종료·만료된 방은 실제 상태를 반환한다. 이 조회로 방을 재개하거나 신규 참여자를 생성하지 않는다.

---

### GET `/api/v1/rooms/{room_id}/waiting-status`

**Summary:** 참여 대기 상태 조회

**Description:** 참여 대기 화면에서 참여자 목록, 접속 상태, 방장 권한 이어받기 가능 여부를 조회한다.

**Responses**

`200 OK`

```json
{
  "success": true,
  "data": {
    "room_id": 10,
    "room_status": "WAITING",
    "participants": [
      {
        "participant_id": 1,
        "nickname": "효림",
        "role": "HOST",
        "connected": true
      }
    ],
    "is_host": false,
    "host_disconnected": false,
    "host_action_expired": false,
    "host_takeover_available_at": null,
    "host_takeover_remaining_seconds": 300,
    "can_take_over_host": false,
    "can_start_vote": false
  }
}
```

**Note**

- MVP에서는 푸시 알림을 사용하지 않고 화면 내 상태 표시로 안내한다.
- 방장 권한 이어받기 버튼은 `last_host_action_at` 이후 5분이 지나면 활성화한다.
- 방장이 계속 접속 중이거나 마지막 진행 액션 이후 5분이 지나지 않았으면 `can_take_over_host = false`를 반환한다.
- 접속 여부는 마지막 정상 방 요청 후 30초 이내를 기준으로 판단한다. `app.room.connection-timeout-seconds`로 조정할 수 있다.
- 대기·상세·복구·후보·투표·탐험 조회는 요청자의 접속 시간을 갱신한다. 조회만으로 방장의 마지막 진행 액션 시간을 갱신하지 않는다.
- 이탈자는 참여자 목록에서 제외한다. 후보가 3개 미만이면 `can_start_vote = false`다. 종료·만료 방에서는 시작과 권한 이전을 허용하지 않는다.

---

### POST `/api/v1/rooms/{room_id}/vote/start`

**Summary:** 퀘스트 투표 시작

**Description:** 방장이 참여자 모집 후 투표를 시작한다. 투표 시작 이후에는 신규 참여자 입장을 차단한다.

**Responses**

`200 OK`

```json
{
  "success": true,
  "data": {
    "room_id": 10,
    "room_status": "VOTING",
    "vote_id": 5
  }
}
```

**구현 규칙**

- 방장만 시작할 수 있고, 최소 3개의 후보가 먼저 생성되어 있어야 한다. 후보가 없으면 `QUEST-002`를 반환한다.
- 방 단위 잠금으로 투표 시작과 다른 투표 상태 변경을 직렬화한다.

---

### POST `/api/v1/rooms/{room_id}/host/takeover`

**Summary:** 방장 권한 이어받기

**Description:** 방장의 마지막 진행 액션 이후 5분 동안 추가 진행이 없는 경우 참여자가 직접 방장 권한을 이어받는다.

**구현 규칙**

- 활성 방에서 기존 방장의 접속이 끊겼고 마지막 진행 액션 이후 5분이 모두 지나야 한다. 미충족 시 `ROOM-005`를 반환한다.
- 방 잠금 아래 기존 방장을 참여자로, 요청자를 방장으로 전환하고 `host_user_id` 및 마지막 진행 액션 시간을 함께 변경한다.
- 변경 후 기존 방장의 진행 권한을 차단한다. 같은 방장의 재요청은 현재 방장 ID를 반환한다.

**Responses**

`200 OK`

```json
{
  "success": true,
  "data": {
    "room_id": 10,
    "host_participant_id": 2
  }
}
```

---

## 7. Invite API

### GET `/api/v1/invites/{invite_token}`

**Summary:** 초대 정보 조회

**Description:** 초대한 사람, 탐험 지역, 초대 날짜, 참여 가능 여부를 조회한다. 초대 링크는 생성 후 24시간 동안 유효하다.

**Responses**

`200 OK`

```json
{
  "success": true,
  "data": {
    "invite_token": "abc123",
    "room_id": 10,
    "host_nickname": "효림",
    "region_name": "홍대",
    "created_at": "2026-10-06T01:00:00",
    "expired_at": "2026-10-07T01:00:00",
    "joinable": true,
    "unjoinable_reason": null
  }
}
```

참여할 수 없는 초대 링크 예시:

```json
{
  "success": true,
  "data": {
    "invite_token": "abc123",
    "room_id": 10,
    "host_nickname": "효림",
    "region_name": "홍대",
    "created_at": "2026-10-06T01:00:00",
    "expired_at": "2026-10-07T01:00:00",
    "joinable": false,
    "unjoinable_reason": "ALREADY_STARTED"
  }
}
```

**Note**

- `unjoinable_reason`은 `EXPIRED`, `ALREADY_STARTED`, `FULL`, `INVALID_LINK`, `FINISHED` 중 하나를 사용한다.
- 탐험방이 생성 후 24시간이 지나 `EXPIRED` 상태가 되면 초대 링크도 참여 불가로 처리한다.

---

### POST `/api/v1/invites/{invite_token}/join`

**Summary:** 초대 링크 참여

**Description:** 회원가입 없이 닉네임을 입력하고 탐험방에 참여한다. 같은 기기에서 이미 참여한 방이면 기존 참여 상태를 복구한다.

**구현 규칙**

- 초대와 방을 잠근 뒤 기존 참여를 먼저 확인한다. 기존 참여자는 정원 및 투표 시작 여부와 무관하게 활성 방으로 복귀하며 기존 닉네임과 투표를 유지한다.
- 신규 참여는 `WAITING` 상태에서만 허용한다. 정원·닉네임 검증과 저장을 같은 방 잠금으로 처리하여 투표 시작과의 경합을 방지한다.
- 만료된 초대·방은 `INVITE-002`, 종료된 방과 이탈자의 재입장은 `ROOM-003`으로 거부한다. 종료·만료 상태 확인은 내 참여 상태 조회를 사용한다.

**Request Body**

| 필드 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| `nickname` | string | O | 탐험방에서 사용할 1~10자 닉네임 |

요청 예시:

```json
{
  "nickname": "민수"
}
```

**Responses**

`200 OK`

```json
{
  "success": true,
  "data": {
    "room_id": 10,
    "participant_id": 2,
    "room_status": "WAITING",
    "restored_by_device": false
  }
}
```

**Error Responses**

| HTTP 상태 | 코드 | 설명 |
| --- | --- | --- |
| 409 | `PARTICIPANT-003` | 같은 탐험방 내 닉네임 중복 |
| 409 | `ROOM-002` | 투표 시작 이후 신규 참여 차단 |
| 409 | `PARTICIPANT-002` | 정원 초과 |
| 410 | `INVITE-002` | 초대 링크 만료 |

---

## 8. Quest Candidate API

### POST `/api/v1/rooms/{room_id}/quest-candidates`

**Summary:** 후보 퀘스트 생성

**Description:** 지역별 구분 없는 공통 퀘스트 DB에서 탐험방에 저장된 일정, 시간대, 음주 여부, 기피 음식 등의 조건과 충돌하는 퀘스트를 제외한다. 조건을 통과한 미완료 퀘스트를 우선 무작위 선정하고, 후보가 6개에 미달하면 조건을 통과한 완료 이력 퀘스트에서 무작위로 보충한다. 후보는 중복 없이 6개를 목표로 선정한다. 탐험 지역은 후보 선정 조건으로 사용하지 않는다.

**Responses**

`200 OK`

```json
{
  "success": true,
  "data": {
    "room_id": 10,
    "candidate_count": 6,
    "filled_with_history_quest": true,
    "need_condition_reset": false,
    "candidates": [
      {
        "candidate_id": 1,
        "quest_id": 101,
        "quest_title": "처음 보는 메뉴 주문하기",
        "quest_description": "평소 먹지 않던 메뉴를 골라보세요.",
        "quest_type": "COMMON",
        "selected_reason": "조건과 충돌하지 않는 공통 퀘스트",
        "candidate_order": 1
      }
    ]
  }
}
```

`400 Bad Request`

```json
{
  "timestamp": "2026-10-06T10:30:00.000000",
  "status": 400,
  "code": "QUEST-003",
  "message": "조건에 맞는 퀘스트가 부족합니다. 탐험 조건을 다시 설정해 주세요.",
  "errors": [],
  "path": "/api/v1/rooms/10/quest-candidates"
}
```

**Note**

- 모든 후보는 같은 공통 퀘스트 DB에서 가져오며, 지역별 후보나 지역 전용 퀘스트 DB를 사용하지 않는다.
- 후보 생성은 `X-Device-Key`로 식별한 현재 방장만 요청할 수 있다. 후보 조회는 해당 방의 현재 참여자에게 허용하며, `LEFT` 참여자와 외부 사용자는 제외한다.
- 생성 요청이 동시에 들어와도 방 단위 잠금과 후보 유일 제약으로 중복 생성을 방지한다.
- 활성 퀘스트 중 일정·시간대·음주 여부·자유 입력 기피 음식 조건을 통과한 후보를 먼저 확보한다. 예산과 지역은 필터링에 사용하지 않는다.
- 완료 이력은 후보 최초 생성 시점에 해당 방에 참여 중인 전체 사용자를 기준으로 집계한다. 방장만을 기준으로 삼지 않으며 `LEFT` 참여자는 제외한다.
- 퀘스트별 완료 경험자 수는 현재 참여자 중 해당 퀘스트의 완료 이력이 있는 서로 다른 사용자 수로 계산한다. 같은 사용자의 반복 완료는 1명으로 센다. 이력이 없는 신규 사용자는 미완료로 취급한다.
- 완료 경험자 수가 0명인 그룹을 먼저 사용하고, 부족하면 1명, 2명 순으로 인원수가 적은 그룹부터 보충한다. 각 그룹 안에서 중복 없이 무작위 선정하고 총 6개를 채우면 멈춘다. 보충 시에도 조건을 무시하지 않는다.
- 예: 모두에게 새로운 후보가 4개이면 그 4개를 선정하고, 완료 경험자 1명인 그룹에서 2개를 무작위 보충한다.
- 음식 조건은 방 생성 시 저장한 표준 키워드와 퀘스트의 필수 음식·재료 키워드 및 상하위 분류 관계를 비교한다. 일반적인 메뉴 선택 퀘스트에는 특정 음식 기피를 적용하여 제외하지 않는다.
- 후보를 새로 생성할 때 무작위 선정을 적용한다. 이미 저장된 후보의 재조회·재요청에서는 같은 후보 목록과 순서를 유지한다.
- `drinking_option = NONE`이면 음주 필수 퀘스트를 제외한다. `AVAILABLE`과 `ANY`에서는 음주·비음주 퀘스트 모두 후보가 될 수 있다.
- `quest_type`은 행동 유형이며, `COOPERATIVE`, `TRANSITION`, `REVISIT`도 지역과 무관하게 같은 DB에서 관리한다.
- `filled_with_history_quest`는 미완료 후보 부족으로 완료 이력 퀘스트를 보충했는지를 의미한다. 기존 범용 유형 보충 필드 `filled_with_common_quest`를 대체하며, `COMMON` 유형에 별도 보충 우선순위를 부여하지 않는다.
- 특정 음식이나 재료를 요구하는 퀘스트는 기피 음식과 충돌하면 제외한다. 음식 종류를 요구하지 않는 퀘스트는 기피 음식만을 이유로 제외하지 않는다.
- 보충 후 후보가 3~5개이면 확보된 후보를 반환하고, 3개 미만이면 `QUEST-003` 오류로 조건 재설정을 안내한다.

---

### GET `/api/v1/rooms/{room_id}/quest-candidates`

**Summary:** 후보 퀘스트 조회

**Description:** 선정된 후보 퀘스트와 본인 선택 여부, 현재 득표수를 조회한다. 목표 후보 수는 6개이며, 조건에 맞는 후보가 부족하면 3~5개를 반환할 수 있다.

**Responses**

`200 OK`

```json
{
  "success": true,
  "data": {
    "candidate_count": 6,
    "need_condition_reset": false,
    "min_select_count": 1,
    "max_select_count": 3,
    "candidates": [
      {
        "candidate_id": 1,
        "quest_title": "처음 보는 메뉴 주문하기",
        "quest_description": "평소 먹지 않던 메뉴를 골라보세요.",
        "quest_type": "COMMON",
        "selected": false,
        "vote_count": 0
      }
    ]
  }
}
```

---

## 9. Vote API

### POST `/api/v1/rooms/{room_id}/votes/me`

**Summary:** 내 투표 저장

**Description:** 참여자가 생성된 후보(목표 6개, 부족 시 3~5개) 중 최소 1개, 최대 3개를 선택하여 투표한다.

**Request Body**

| 필드 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| `candidate_ids` | number[] | O | 선택한 후보 퀘스트 ID 목록 |

요청 예시:

```json
{
  "candidate_ids": [1, 2, 3]
}
```

**Responses**

`200 OK`

```json
{
  "success": true,
  "data": {
    "room_id": 10,
    "voted": true,
    "candidate_ids": [1, 2, 3]
  }
}
```

---

### PUT `/api/v1/rooms/{room_id}/votes/me`

**Summary:** 내 투표 수정

**Description:** 투표 마감 전까지 참여자 본인의 투표 내용을 수정한다.

**Request Body**

| 필드 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| `candidate_ids` | number[] | O | 수정할 후보 퀘스트 ID 목록 |

**Responses**

`200 OK`

```json
{
  "success": true,
  "data": {
    "room_id": 10,
    "candidate_ids": [2, 4]
  }
}
```

**Error Responses**

| HTTP 상태 | 코드 | 설명 |
| --- | --- | --- |
| 409 | `VOTE-001` | 이미 마감된 투표 |
| 400 | `VOTE-002` | 최소 1개, 최대 3개 선택 규칙 위반 |

---

### GET `/api/v1/rooms/{room_id}/votes/status`

**Summary:** 투표 현황 조회

**Description:** 참여자별 투표 여부, 퀘스트별 득표수, 화면에 표시할 투표 완료 상태 문구를 조회한다.

**Responses**

`200 OK`

```json
{
  "success": true,
  "data": {
    "total_participant_count": 4,
    "voted_participant_count": 3,
    "selected_count": 2,
    "max_select_count": 3,
    "vote_status_text": "4명 중 3명 투표 완료",
    "push_notification_enabled": false,
    "participants": [
      {
        "participant_id": 1,
        "nickname": "효림",
        "voted": true
      }
    ],
    "candidate_results": [
      {
        "candidate_id": 1,
        "quest_title": "처음 보는 메뉴 주문하기",
        "vote_count": 2
      }
    ]
  }
}
```

**Note**

- 모든 참여자의 투표 완료 여부는 앱 내부 상태로 표시한다.
- MVP에서는 푸시 알림을 발송하지 않는다.

**구현 규칙**

- 해당 방의 현재 참여자만 조회할 수 있다. `LEFT` 참여자는 인원·투표 여부·득표 집계에서 제외한다.
- `selected_count`는 요청한 참여자 본인의 현재 선택 개수다. 득표수 0인 후보도 결과에 포함한다.

---

### GET `/api/v1/rooms/{room_id}/votes/close-preview`

**Summary:** 투표 마감 확인 정보 조회

**Description:** 투표 마감 확인창에 표시할 미투표 인원과 현재 상위 후보를 조회한다.

**Responses**

`200 OK`

```json
{
  "success": true,
  "data": {
    "not_voted_participant_count": 1,
    "confirmation_required": true,
    "reopen_supported": false,
    "top_candidates": [
      {
        "candidate_id": 1,
        "quest_title": "처음 보는 메뉴 주문하기",
        "vote_count": 2
      }
    ]
  }
}
```

**Note**

- 미투표자가 없어도 실수 방지를 위해 확인창을 표시한다.

**구현 규칙**

- 현재 방장만 조회할 수 있으며 실제 마감 시점에는 미투표 인원을 다시 계산한다.
- `top_candidates`는 득표수 상위 최대 3개의 참고 목록이다. 동점 후보 전체와 필요한 선택 개수는 최종 확정 미리보기에서 확인한다.

---

### POST `/api/v1/rooms/{room_id}/votes/close`

**Summary:** 투표 마감

**Description:** 방장이 확인창을 승인한 뒤 투표를 마감한다. 이후 투표 및 수정은 차단된다.

**Request Body**

| 필드 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| `confirmed` | boolean | O | 확인창 승인 여부 |

요청 예시:

```json
{
  "confirmed": true
}
```

**Responses**

`200 OK`

```json
{
  "success": true,
  "data": {
    "room_id": 10,
    "room_status": "VOTE_CLOSED",
    "not_voted_participant_count": 1,
    "reopen_supported": false
  }
}
```

**Note**

- MVP에서는 투표 마감 후 다시 여는 기능을 제공하지 않는다.

**구현 규칙**

- `confirmed`가 누락·null·false이면 `VOTE-003`으로 거부한다. 이미 마감한 투표의 재마감은 `VOTE-001`을 반환한다.
- 마감 시 미투표 인원·확인 승인·마감 일시를 저장하고 방 상태를 `VOTE_CLOSED`로 변경한다.
- 투표 제출·수정·마감은 같은 방 단위 잠금을 사용하여 마감 후 투표가 저장되지 않도록 한다.

---

## 10. Final Quest API

### GET `/api/v1/rooms/{room_id}/final-quests/preview`

**Summary:** 최종 퀘스트 확정 미리보기

**Description:** 득표수 기준 상위 3개 확정 가능 여부와 동점 후보 존재 여부를 조회한다.

**Responses**

`200 OK - 동점 없음`

```json
{
  "success": true,
  "data": {
    "tie_break_required": false,
    "auto_confirmable": true,
    "final_quest_candidates": [
      {
        "candidate_id": 1,
        "quest_title": "처음 보는 메뉴 주문하기",
        "vote_count": 3,
        "rank_no": 1
      }
    ]
  }
}
```

`200 OK - 동점 있음`

```json
{
  "success": true,
  "data": {
    "tie_break_required": true,
    "auto_confirmable": false,
    "tie_groups": [
      {
        "tie_group_no": 1,
        "required_select_count": 1,
        "candidates": [
          {
            "candidate_id": 4,
            "quest_title": "친구가 메인 메뉴 고르기",
            "vote_count": 2
          }
        ]
      }
    ]
  }
}
```

**구현 규칙**

- 투표 마감 후 현재 참여자가 조회한다. 최종 3개에 포함될 후보가 달라지는 선정 경계의 동점만 방장 선택을 요구한다.
- 상위 3개 내부의 동점으로 선정 대상이 바뀌지 않으면 별도 선택 없이 확정할 수 있다. 같은 득표수의 표시 순서는 기존 후보 노출 순서를 따른다.
- 예: 득표수가 `2, 2, 1, 0, 0, 0`이면 선택 없이 상위 3개를 확정할 수 있다. `2, 1, 1, 1, 1, 0`이면 2표 후보는 유지하고 1표 후보 4개 중 2개를 선택한다.
- 전원 미투표여도 마감할 수 있으며, 후보가 6개 모두 0표이면 방장이 3개를 선택한다. 후보가 정확히 3개이면 모두 선정되므로 별도 선택이 필요하지 않다.
- 동점 선택 후에는 최종 후보 3개와 `tie_break_required = false`를 반환한다. `auto_confirmable`은 별도 선택 없이 확정 요청을 할 수 있다는 뜻이며 자동 저장을 의미하지 않는다.

---

### POST `/api/v1/rooms/{room_id}/final-quests/tie-break`

**Summary:** 동점 후보 선택

**Description:** 재투표 없이 방장이 동점 후보 중 최종 퀘스트를 직접 선택한다.

**Request Body**

| 필드 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| `selected_candidate_ids` | number[] | O | 방장이 선택한 동점 후보 ID 목록 |

**Responses**

`200 OK`

```json
{
  "success": true,
  "data": {
    "room_id": 10,
    "tie_break_resolved": true,
    "selected_candidate_ids": [4]
  }
}
```

**구현 규칙**

- 마감 후 최종 확정 전 현재 방장만 선택할 수 있다. 동점 그룹에서 필요한 개수만 중복 없이 선택해야 하며, 다른 후보·다른 방 후보·잘못된 개수는 `COMMON-001`로 거부한다.
- 선택 후보 ID와 선택한 방장 참여자를 `vote`에 임시 저장한다. 아직 `final_quest`를 생성하거나 방을 `QUEST_CONFIRMED`로 변경하지 않는다.
- 최종 확정 전에는 선택을 수정할 수 있다. 선택한 ID 순서를 동점 후보 간 최종 순서로 사용한다.

---

### POST `/api/v1/rooms/{room_id}/final-quests`

**Summary:** 최종 퀘스트 확정

**Description:** 득표수 기준 상위 3개 퀘스트를 확정한다. 동점이 있으면 방장의 동점 후보 선택 이후 확정한다.

**Responses**

`200 OK`

```json
{
  "success": true,
  "data": {
    "room_id": 10,
    "room_status": "QUEST_CONFIRMED",
    "final_quests": [
      {
        "final_quest_id": 1,
        "rank_no": 1,
        "quest_title": "처음 보는 메뉴 주문하기",
        "vote_count": 2,
        "selection_reason": "VOTE_RANK"
      }
    ]
  }
}
```

**구현 규칙**

- 현재 방장만 확정할 수 있다. 마감 전 요청은 `ROOM-003`, 필요한 동점 선택이 없으면 `FINAL-001`을 반환한다.
- 상위 후보와 방장 선택 후보를 합쳐 최종 3개를 저장한다. 동점 선택 후보에는 선택 방장·그룹·순서와 `HOST_TIE_BREAK` 사유를 기록한다.
- 방을 `QUEST_CONFIRMED`로 변경하고 현재 참여자를 `READY`로 전환한다.
- 재요청·동시 요청에도 기존 최종 퀘스트 ID를 그대로 반환하고 중복 생성하지 않는다. 확정 후 동점 선택 변경은 허용하지 않는다.

---

## 11. Exploration API

### POST `/api/v1/rooms/{room_id}/exploration/start`

**Summary:** 탐험 시작

**Description:** 확정된 퀘스트 3개를 기준으로 탐험 상태를 진행 중으로 변경한다.

**구현 규칙**

- 방장만 시작할 수 있다. 현재 참여자별로 퀘스트 3개의 진행 상태를 생성한다.
- 진행 중 재요청은 기존 상태를 반환하며 진행 행을 중복 생성하지 않는다. 종료·만료 후 재시작은 허용하지 않는다.

**Responses**

`200 OK`

```json
{
  "success": true,
  "data": {
    "room_id": 10,
    "room_status": "IN_PROGRESS"
  }
}
```

---

### GET `/api/v1/rooms/{room_id}/exploration/progress`

**Summary:** 탐험 진행 조회

**Description:** 지역, 참여자, 퀘스트 완료 상태, 전체 진행률을 표시한다.

**집계 기준**

- `completed`, `completed_quest_count`, `progress_rate`는 요청자 본인을 기준으로 계산한다. 진행률은 본인 완료 개수 × 100 ÷ 전체 개수의 정수 부분이다.
- `completed_participant_count`는 해당 퀘스트를 완료한 현재 참여자 수다.
- 종료 후에도 참여자는 진행 결과를 조회할 수 있다.

**Responses**

`200 OK`

```json
{
  "success": true,
  "data": {
    "room_id": 10,
    "region_name": "홍대",
    "participant_count": 4,
    "total_quest_count": 3,
    "completed_quest_count": 1,
    "progress_rate": 33,
    "quests": [
      {
        "final_quest_id": 1,
        "quest_title": "처음 보는 메뉴 주문하기",
        "completed": true,
        "completed_participant_count": 4
      }
    ]
  }
}
```

---

### PATCH `/api/v1/rooms/{room_id}/final-quests/{final_quest_id}/progress`

**Summary:** 퀘스트 완료 상태 변경

**Description:** 퀘스트별 완료 또는 완료 취소를 처리한다. 사진, GPS, 영수증 인증은 요구하지 않는다.

**구현 규칙**

- 진행 중인 방에서 요청자 본인의 상태만 변경한다. 다른 방의 퀘스트와 종료·만료 이후 변경은 거부한다.
- 같은 완료값의 재요청은 완료 시간을 유지한다. 완료 취소 시 완료 시간을 비운다.

**Request Body**

| 필드 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| `completed` | boolean | O | 완료 여부 |

**Responses**

`200 OK`

```json
{
  "success": true,
  "data": {
    "final_quest_id": 1,
    "completed": true,
    "completed_at": "2026-10-06T02:00:00",
    "requires_photo_auth": false,
    "requires_gps_auth": false,
    "requires_receipt_auth": false
  }
}
```

---

### POST `/api/v1/rooms/{room_id}/exploration/finish`

**Summary:** 탐험 종료

**Description:** 탐험을 종료하고 이후 퀘스트 상태 변경을 차단한다. 사용자별 탐험 기록을 생성한다.

**구현 규칙**

- 방장만 종료하며 일부 퀘스트가 미완료여도 종료할 수 있다.
- 현재 참여자 전원의 개인별 탐험 기록과 최종 완료 상태인 퀘스트 이력을 같은 트랜잭션으로 저장한다. 취소된 항목은 이력에서 제외한다.
- 종료 재요청은 방장의 기존 `record_id`를 반환한다. 다른 참여자는 내 기록 목록에서 본인 기록 ID를 조회한다.
- 종료 및 완료 상태 변경은 방 잠금으로 직렬화한다. 종료된 방은 시간 경과 후에도 `FINISHED`를 유지한다.

**Responses**

`200 OK`

```json
{
  "success": true,
  "data": {
    "room_id": 10,
    "room_status": "FINISHED",
    "record_id": 3,
    "story_optional": true
  }
}
```

---

## 12. Record API

### GET `/api/v1/users/me/statistics`

**Summary:** 사용자 통계 조회

**Description:** 완료한 탐험, 완료한 퀘스트, 방문 지역 수, 리텐션 단계 달성 정보를 조회한다.

**Responses**

`200 OK`

```json
{
  "success": true,
  "data": {
    "completed_exploration_count": 3,
    "completed_quest_count": 9,
    "visited_region_count": 2,
    "retention_stages": [
      {
        "stage_code": "FIRST_DISCOVERY",
        "stage_name": "첫 발견",
        "achieved": true,
        "reward_description": "첫 탐험 카드"
      }
    ]
  }
}
```

---

### GET `/api/v1/users/me/records`

**Summary:** 탐험 기록 목록 조회

**Description:** 완료된 탐험 목록을 날짜순으로 조회한다.

**구현 규칙**

- 본인 기록만 조회한다. `page`는 0부터 시작하며 기본 0, `size`는 기본 20이고 1~100을 허용한다.
- 생성 일시 내림차순, 같은 시각이면 기록 ID 내림차순으로 정렬하고 다음 페이지 존재 여부를 반환한다.

**Query Parameters**

| 이름 | 필수 | 설명 |
| --- | --- | --- |
| `page` | X | 페이지 번호 |
| `size` | X | 페이지 크기 |

**Responses**

`200 OK`

```json
{
  "success": true,
  "data": {
    "records": [
      {
        "record_id": 3,
        "region_name": "홍대",
        "participant_count": 4,
        "completed_quest_count": 3,
        "created_at": "2026-10-06T02:30:00"
      }
    ],
    "has_next": false
  }
}
```

---

### GET `/api/v1/records/{record_id}`

**Summary:** 탐험 기록 상세 조회

**Description:** 지역, 날짜, 참여자, 사진, 완료 퀘스트 정보를 조회한다.

**구현 규칙**

- 본인 소유 기록만 조회한다. 타인의 기록과 존재하지 않는 기록은 모두 `RECORD-001`로 응답한다.
- 완료 퀘스트는 기록 소유자의 최종 완료 상태를 기준으로 순위순으로 반환한다.
- 현재 사진 업로드 기능은 후속 개발 범위이므로 `photos`는 빈 배열을 반환한다.

**Responses**

`200 OK`

```json
{
  "success": true,
  "data": {
    "record_id": 3,
    "region_name": "홍대",
    "created_at": "2026-10-06T02:30:00",
    "participants": ["효림", "민수"],
    "completed_quests": [
      {
        "quest_title": "처음 보는 메뉴 주문하기",
        "completed": true
      }
    ],
    "photos": [
      {
        "photo_id": 1,
        "photo_url": "https://cdn.meokgo.app/photo/1.jpg"
      }
    ]
  }
}
```

---

## 13. Story API

### GET `/api/v1/story-templates`

**Summary:** Story 템플릿 목록 조회

**Description:** 기록 이미지 생성에 사용할 Story 템플릿 목록을 조회한다.

**Responses**

`200 OK`

```json
{
  "success": true,
  "data": {
    "templates": [
      {
        "template_id": 1,
        "template_name": "기본 템플릿",
        "preview_url": "https://cdn.meokgo.app/templates/basic.png"
      }
    ]
  }
}
```

---

### POST `/api/v1/records/{record_id}/photos`

**Summary:** 기록 사진 업로드

**Description:** Story 제작을 선택한 사용자에게만 앨범 권한을 요청하고, 최소 1장부터 최대 4장까지 사진을 업로드한다.

**Request Body**

| 필드 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| `photos` | file[] | O | 사진 파일 목록, 1~4장 |

**Responses**

`200 OK`

```json
{
  "success": true,
  "data": {
    "record_id": 3,
    "photos": [
      {
        "photo_id": 1,
        "photo_url": "https://cdn.meokgo.app/photo/1.jpg"
      }
    ]
  }
}
```

**Note**

- 사진은 퀘스트 인증 용도가 아니라 탐험 종료 후 Story 제작 재료다.
- Story 제작용 사진은 S3 저장을 우선으로 하며, 초기 개발 상황에 따라 서버 로컬 저장을 허용한다.
- Story 제작용 사진은 업로드 후 30일 동안 보관한다.

---

### POST `/api/v1/records/{record_id}/story-image`

**Summary:** Story 이미지 생성

**Description:** 사진, 지역, 날짜, 완료 퀘스트 정보를 조합하여 9:16 기록 이미지를 생성한다. Story 이미지는 S3 저장을 우선으로 하며, 초기 개발 상황에 따라 서버 로컬 저장을 허용한다.

**Request Body**

| 필드 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| `template_id` | number | O | 템플릿 ID |
| `photo_ids` | number[] | O | Story에 사용할 사진 ID 목록 |
| `image_ratio` | string | X | 기본값 `9:16` |
| `memo` | string | X | 기록 메모 |

**Responses**

`200 OK`

```json
{
  "success": true,
  "data": {
    "story_image_id": 1,
    "story_image_url": "https://cdn.meokgo.app/story/1.png",
    "image_ratio": "9:16",
    "storage_provider": "S3",
    "expired_at": "2026-11-05T02:40:00"
  }
}
```

---

### GET `/api/v1/records/{record_id}/story-image/{story_image_id}`

**Summary:** Story 이미지 조회

**Description:** 생성된 Story 이미지를 저장 또는 공유하기 전에 조회한다.

**Responses**

`200 OK`

```json
{
  "success": true,
  "data": {
    "story_image_id": 1,
    "story_image_url": "https://cdn.meokgo.app/story/1.png",
    "image_ratio": "9:16",
    "storage_provider": "S3",
    "expired_at": "2026-11-05T02:40:00",
    "created_at": "2026-10-06T02:40:00"
  }
}
```

**Note**

- Story 이미지는 생성 후 30일 동안 보관한다.
- 보관 기간이 지난 이미지는 조회할 수 없거나 삭제된 상태로 응답한다.

---

## 14. 실시간 갱신 정책

MVP에서는 HTTP 폴링을 기본으로 한다. WebSocket과 SSE는 MVP 범위에서 제외하고 추후 확장 후보로 둔다.

| 화면 | API | 호출 주기 |
| --- | --- | --- |
| 06. 참여 대기 | GET `/api/v1/rooms/{room_id}/waiting-status` | 5초 |
| 08. 투표 현황 | GET `/api/v1/rooms/{room_id}/votes/status` | 5초 |
| 09. 투표 대기 | GET `/api/v1/rooms/{room_id}/votes/status` | 5초 |
| 11. 탐험 진행 중 | GET `/api/v1/rooms/{room_id}/exploration/progress` | 필요 시 갱신 |

---

## 15. 화면별 API 매핑

| 화면 | 기능 | API |
| --- | --- | --- |
| 00. 스플래시 | 최초 실행 여부 확인 | GET `/api/v1/users/me/bootstrap` |
| 01. 닉네임 설정 | 닉네임 최초 설정 | POST `/api/v1/users/me/nickname` |
| 02. 홈 | 홈 화면 조회 | GET `/api/v1/home` |
| 03-1. 탐험 지역 선택 | 지역 조회, 최근 지역 조회 | GET `/api/v1/regions`, GET `/api/v1/users/me/recent-regions` |
| 03. 오늘의 탐험 설정 | 기피 음식 인식 결과 확인·수정, 조건 저장 및 방 생성 | POST `/api/v1/food-preferences/preview`, POST `/api/v1/rooms` |
| 04. 탐험방 생성 완료 | 초대 링크 표시 | POST `/api/v1/rooms` 응답값 사용 |
| 05. 초대 링크 참여 | 초대 조회, 참여 | GET `/api/v1/invites/{invite_token}`, POST `/api/v1/invites/{invite_token}/join` |
| 05-1. 참여 상태 복구 | 같은 기기 참여 상태 및 투표 내역 복구 | GET `/api/v1/rooms/{room_id}/participants/me` |
| 06. 참여 대기 | 참여자 목록 조회, 상태 갱신 | GET `/api/v1/rooms/{room_id}/waiting-status` |
| 06-1. 참여 대기 방장 | 투표 시작 | POST `/api/v1/rooms/{room_id}/vote/start` |
| 06-3. 방장 미접속 | 방장 권한 이전 | POST `/api/v1/rooms/{room_id}/host/takeover` |
| 07. 퀘스트 투표 | 후보 조회, 투표 저장 | GET `/api/v1/rooms/{room_id}/quest-candidates`, POST `/api/v1/rooms/{room_id}/votes/me` |
| 08. 투표 현황 | 투표 현황 조회 | GET `/api/v1/rooms/{room_id}/votes/status` |
| 08-1. 투표 마감 확인 | 마감 정보 조회, 마감 | GET `/api/v1/rooms/{room_id}/votes/close-preview`, POST `/api/v1/rooms/{room_id}/votes/close` |
| 10. 퀘스트 확정 | 최종 퀘스트 미리보기, 동점 후보 선택, 최종 확정 | GET `/api/v1/rooms/{room_id}/final-quests/preview`, POST `/api/v1/rooms/{room_id}/final-quests/tie-break`, POST `/api/v1/rooms/{room_id}/final-quests` |
| 11. 탐험 진행 중 | 진행 조회, 퀘스트 완료 | GET `/api/v1/rooms/{room_id}/exploration/progress`, PATCH `/api/v1/rooms/{room_id}/final-quests/{final_quest_id}/progress` |
| 12. 탐험 종료 | 탐험 종료 및 기록 생성 | POST `/api/v1/rooms/{room_id}/exploration/finish` |
| 13. 내 기록 | 통계, 기록 목록 | GET `/api/v1/users/me/statistics`, GET `/api/v1/users/me/records` |
| 14. 탐험 기록 상세 | 기록 상세 조회 | GET `/api/v1/records/{record_id}` |
| 15. 기록 남기기 | 템플릿 조회, 사진 업로드 | GET `/api/v1/story-templates`, POST `/api/v1/records/{record_id}/photos` |
| 16. 기록 미리보기 | Story 이미지 생성 및 조회 | POST `/api/v1/records/{record_id}/story-image`, GET `/api/v1/records/{record_id}/story-image/{story_image_id}` |

---

## 16. 확정 정책 및 추후 보완 후보

아래 정책은 MVP 기준으로 확정했다.

| 항목 | 확정값 |
| --- | --- |
| 방장 권한 이어받기 버튼 활성화 기준 시간 | 방장 마지막 진행 액션 이후 5분 |
| 초대 링크 만료 시간 | 생성 후 24시간 |
| 탐험방 만료 시간 | 생성 후 24시간 |
| 실시간 처리 방식 | HTTP 폴링 |
| Story 이미지 저장 위치 | S3 우선, 초기 개발 상황에 따라 서버 로컬 저장 허용 |
| Story 이미지 보관 기간 | 생성 후 30일 |
| 탐험 지역 선택 | 등록된 여러 활성 지역 중 사용자가 하나를 직접 선택 |
| 지역 정보 용도 | 탐험 장소 표시·최근 선택·기록·통계에 사용하며 퀘스트 필터링에는 사용하지 않음 |
| 퀘스트 운영 데이터 | 지역별 구분 없는 공통 DB에서 일정·시간대·음주 여부·기피 음식 등의 조건으로 선정 |
| 기피 음식 입력 | 자유 입력 원문 유지, 표준 키워드·동의어·상하위 분류 사전 매칭 및 인식 결과 확인·수정 |
| 예산 | 선택·입력 기능 및 후보 필터링에서 제외 |
| 음주 조건 | 음주 안 함은 음주 필수 퀘스트 제외, 음주 가능·무관은 비음주 퀘스트도 포함 |
| 후보 선정 순서 | 조건 통과 → 현재 참여자 중 완료 경험자 0명인 그룹부터 인원수 오름차순으로 그룹 내 무작위 선정 |
| 후보 부족 처리 | 보충 후 3~5개이면 확보된 후보 사용, 3개 미만이면 조건 재설정 안내 |

추후 보완 후보는 다음과 같다.

- S3 사용 확정 시 버킷명, 접근 URL 정책, 만료 파일 삭제 배치 확정
- 공통 퀘스트의 운영 문구, 적용 조건 및 검수 기준 확정
- 사용자가 선택할 수 있는 운영 지역 목록 확정

기피 음식 사전의 음식명 확대와 자연스러운 나열·기피 문장 인식 확장은 후속 작업으로 둔다.
