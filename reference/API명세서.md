# 먹으러GO API 명세서

> 작성 기준일: 2026-10-06
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

본 API 명세서는 `Reference` 폴더 내 DB 설계 파일과 사용자가 제공한 기획 자료의 일치 여부를 확인하여 작성했다.

| 참조 파일 | 반영 내용 |
| --- | --- |
| `Reference/DB설계서.md` | `device_user`, `region`, `exploration_room`, `room_participant`, `quest`, `vote`, `final_quest`, `exploration_record`, `story_image` 등 테이블 구조와 API 매핑 검증 |
| `추민교_먹으러GO_발표.pdf` | 조건 설정, 링크 기반 참여, 6개 퀘스트 투표, 3개 확정, 완료 버튼 중심 수행, Story 선택 제작, MVP 범위 반영 |
| 기능명세서 스크린샷 | 스플래시, 닉네임 설정, 홈, 탐험 설정, 탐험방 생성, 참여 대기, 투표, 탐험 진행, 내 기록, 기록 남기기 화면 API 반영 |
| 추가 정책 회의 내용 | 같은 기기 참여 복구, 닉네임 중복 방지, 후보 부족 처리, 투표 마감 확인, 동점 방장 선택, 푸시 알림 제외 반영 |

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
| `quest_type` | `COMMON`, `LOCAL`, `COOPERATIVE`, `TRANSITION`, `REVISIT` |
| `vote_status` | `OPEN`, `CLOSED` |
| `final_quest_selection_reason` | `VOTE_RANK`, `HOST_TIE_BREAK` |
| `progress_status` | `TODO`, `DONE`, `CANCELED` |
| `retention_stage` | `FIRST_DISCOVERY`, `ALLEY_EXPLORER`, `REGION_MASTER` |

**Note**

- `X-Device-Key`는 같은 기기 재접속 시 참여 상태와 투표 내역 복구에 사용한다.
- 다른 기기에서 기존 참여 내역을 복구하는 기능은 MVP에서 제외한다.
- 푸시 알림은 MVP에서 제외하며, 투표 상태는 앱 내부 문구로 표시한다.
- 퀘스트 완료는 사진, GPS, 영수증 인증 없이 완료 버튼으로 처리한다.

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
        "created_at": "2026-10-06T01:30:00"
      }
    ],
    "popular_regions": [
      {
        "region_id": 1,
        "region_name": "홍대",
        "exploration_count": 12
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

---

## 5. Region API

### GET `/api/v1/regions`

**Summary:** 지역 검색 및 분류 조회

**Description:** 검색어와 일치하는 지역 또는 상위 지역에 속한 하위 지역 목록을 조회한다.

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
        "parent_region_id": null
      }
    ]
  }
}
```

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
        "selected_at": "2026-10-06T01:00:00"
      }
    ]
  }
}
```

---

## 6. Room API

### POST `/api/v1/rooms`

**Summary:** 탐험방 생성

**Description:** 선택한 지역, 일정, 시간대, 예산, 음주 여부, 기피 음식을 조건으로 새로운 탐험방을 생성한다. 생성자는 방장이 된다.

**Request Body**

| 필드 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| `region_id` | number | O | 탐험 지역 ID |
| `schedule_type` | string | O | `MEAL`, `CAFE`, `PUB`, `SECOND_ROUND` |
| `time_slot` | string | X | `LUNCH`, `DINNER`, `LATE_NIGHT`, `ANY` |
| `budget_min` | number | X | 최소 예산 |
| `budget_max` | number | X | 최대 예산 |
| `drinking_option` | string | O | `NONE`, `AVAILABLE`, `ANY` |
| `avoid_foods` | string | X | 기피 음식 |

요청 예시:

```json
{
  "region_id": 1,
  "schedule_type": "MEAL",
  "time_slot": "DINNER",
  "budget_min": 10000,
  "budget_max": 30000,
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

---

### GET `/api/v1/rooms/{room_id}`

**Summary:** 탐험방 상세 조회

**Description:** 탐험방 지역, 조건, 참여자, 현재 상태를 조회한다.

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
      "budget_min": 10000,
      "budget_max": 30000,
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
    "host_disconnected": false,
    "host_action_expired": false,
    "host_takeover_available_at": null,
    "can_take_over_host": false
  }
}
```

**Note**

- MVP에서는 푸시 알림을 사용하지 않고 화면 내 상태 표시로 안내한다.
- 방장 권한 이어받기 버튼 활성화 기준 시간은 추후 확정한다.

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

---

### POST `/api/v1/rooms/{room_id}/host/takeover`

**Summary:** 방장 권한 이어받기

**Description:** 일정 시간 동안 방장이 진행하지 않은 경우 참여자가 직접 방장 권한을 이어받는다.

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

**Description:** 초대한 사람, 탐험 지역, 초대 날짜, 참여 가능 여부를 조회한다.

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
    "joinable": true
  }
}
```

---

### POST `/api/v1/invites/{invite_token}/join`

**Summary:** 초대 링크 참여

**Description:** 회원가입 없이 닉네임을 입력하고 탐험방에 참여한다. 같은 기기에서 이미 참여한 방이면 기존 참여 상태를 복구한다.

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

---

## 8. Quest Candidate API

### POST `/api/v1/rooms/{room_id}/quest-candidates`

**Summary:** 후보 퀘스트 생성

**Description:** 탐험 조건에 맞지 않는 퀘스트를 제외하고 이전 완료 이력을 축소 반영한 뒤, 중복 없이 후보 6개를 생성한다. 조건 후보가 부족하면 범용 퀘스트로 보충한다.

**Responses**

`200 OK`

```json
{
  "success": true,
  "data": {
    "room_id": 10,
    "candidate_count": 6,
    "filled_with_common_quest": true,
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

- 조건 후보가 6개 미만이면 범용 퀘스트로 보충한다.
- 범용 퀘스트까지 포함해도 3개 미만이면 조건 재설정을 안내한다.

---

### GET `/api/v1/rooms/{room_id}/quest-candidates`

**Summary:** 후보 퀘스트 조회

**Description:** 선정된 후보 퀘스트 6개와 본인 선택 여부, 현재 득표수를 조회한다.

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

**Description:** 참여자가 후보 6개 중 최소 1개, 최대 3개를 선택하여 투표한다.

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

---

## 11. Exploration API

### POST `/api/v1/rooms/{room_id}/exploration/start`

**Summary:** 탐험 시작

**Description:** 확정된 퀘스트 3개를 기준으로 탐험 상태를 진행 중으로 변경한다.

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

---

### POST `/api/v1/records/{record_id}/story-image`

**Summary:** Story 이미지 생성

**Description:** 사진, 지역, 날짜, 완료 퀘스트 정보를 조합하여 9:16 기록 이미지를 생성한다.

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
    "image_ratio": "9:16"
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
    "created_at": "2026-10-06T02:40:00"
  }
}
```

---

## 14. 실시간 갱신 정책

MVP에서는 HTTP 폴링을 기본으로 한다. 추후 필요 시 WebSocket 또는 SSE로 확장한다.

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
| 03. 오늘의 탐험 설정 | 조건 저장 및 방 생성 | POST `/api/v1/rooms` |
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

## 16. 보완 필요 사항

- 방장 권한 이어받기 버튼 활성화 기준 시간 확정
- 초대 링크 만료 시간 확정
- 탐험방 만료 시간 확정
- 실시간 처리 방식을 폴링, WebSocket, SSE 중 하나로 확정
- Story 이미지 저장 위치와 보관 기간 확정
- 초기 지역과 지역별 퀘스트 운영 데이터 확정
