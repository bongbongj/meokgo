# 먹으러GO DB 설계서

> 작성 기준일: 2026-10-06
>
> 기준 서비스: 먹으러GO
>
> DB 엔진: MySQL 8.0 기준
>
> 설계 범위: `meokgo_db`
>
> 작성자: 정효림
>
> 작성 기준: 기능명세서 스크린샷, `추민교_먹으러GO_발표.pdf`, `Reference/API명세서.md`, 추가 정책 회의 내용 검토 결과

> 최종 판단: 현재 MVP 요구사항 범위에서는 본 문서를 기준으로 DB 구현을 진행할 수 있다. 방장 권한 이어받기 기준, 링크 만료 시간, 방 만료 시간, Story 보관 기간, 초기 운영 데이터 기준은 본 문서의 확정 정책을 따른다.

---

## 1. 참조 문서 확인

본 문서는 `Reference` 폴더 내 파일과 사용자가 제공한 기획 자료의 일치 여부를 확인하여 작성했다.

| 참조 파일 | 반영 내용 |
| --- | --- |
| `Reference/API명세서.md` | 사용자, 지역, 탐험방, 참여자, 초대 링크, 퀘스트 후보, 투표, 동점 처리, 탐험 진행, 기록, Story API와 테이블 매핑 검증 |
| `추민교_먹으러GO_발표.pdf` | 맛집 추천이 아닌 경험 퀘스트 서비스, 조건 설정, 링크 기반 비회원 참여, 퀘스트 6개 투표, 3개 확정, 완료 버튼 중심 수행, 9:16 Story 카드, MVP 범위 반영 |
| 기능명세서 스크린샷 | 스플래시, 닉네임 설정, 홈, 탐험 설정, 탐험방 생성, 초대 참여, 참여 대기, 투표, 투표 현황, 퀘스트 확정, 탐험 진행, 내 기록, 기록 남기기 화면 흐름 반영 |
| 추가 정책 회의 내용 | 같은 기기 참여 상태 복구, 다른 기기 복구 제외, 같은 방 닉네임 중복 방지, 후보 부족 시 범용 퀘스트 보충, 투표 마감 확인창, 동점 시 방장 선택, 푸시 알림 제외 반영 |

---

## 2. 설계 원칙

- 모든 테이블은 `meokgo_db` 단일 스키마에 배치한다.
- MVP에서는 로그인 없이 기기 기반 사용자 식별자인 `device_key`를 기준으로 사용자를 구분한다.
- 같은 기기에서 재접속하면 기존 탐험방 참여 상태와 투표 내역을 복구한다.
- MVP에서는 다른 기기에서 기존 참여 내역을 복구하지 않는다.
- 참여자는 회원가입 없이 닉네임으로 탐험방에 참여할 수 있다.
- 닉네임은 같은 탐험방 안에서 중복될 수 없다.
- 방장이 앱을 종료했다가 다시 접속해도 진행 중인 탐험방은 유지한다.
- 투표 시작 이후에는 신규 참여자의 입장을 차단한다.
- 투표 마감 전까지 참여자 본인의 투표 수정은 허용한다.
- 투표 마감 후 다시 여는 기능은 MVP에서 제외한다.
- 모든 참여자가 투표하지 않아도 방장은 투표를 마감할 수 있다.
- 투표 마감 전에는 미투표 인원을 안내하고 확인창 승인을 기록한다.
- 최종 퀘스트 선정 중 동점이 발생하면 재투표하지 않고 방장이 직접 선택한다.
- 퀘스트 수행 인증에는 사진, GPS, 영수증을 사용하지 않고 완료 버튼만 사용한다.
- 사진은 퀘스트 인증이 아니라 탐험 종료 후 선택하는 Story 제작 재료로만 저장한다.
- 푸시 알림은 MVP에서 제외하고, 앱 내부 투표 상태 표시로 대체한다.
- 작업 이력이 필요한 데이터는 물리 삭제보다 상태값과 일시 컬럼으로 관리한다.

---

## 3. 스키마 배치 요약

```text
MySQL 8.0
  └── meokgo_db
      ├── device_user
      ├── region
      ├── user_recent_region
      ├── exploration_room
      ├── exploration_condition
      ├── invite_link
      ├── room_participant
      ├── quest
      ├── room_quest_candidate
      ├── vote
      ├── vote_item
      ├── final_quest
      ├── quest_progress
      ├── exploration_record
      ├── record_photo
      ├── story_template
      ├── story_image
      ├── user_quest_history
      ├── retention_stage
      └── user_retention_stage
```

---

## 4. ERD 요약

```text
device_user 1 : N user_recent_region
device_user 1 : N exploration_room
device_user 1 : N room_participant
device_user 1 : N exploration_record
device_user 1 : N user_quest_history
device_user 1 : N user_retention_stage

region 1 : N user_recent_region
region 1 : N exploration_room
region 1 : N exploration_record

exploration_room 1 : 1 exploration_condition
exploration_room 1 : N invite_link
exploration_room 1 : N room_participant
exploration_room 1 : N room_quest_candidate
exploration_room 1 : 1 vote
exploration_room 1 : N final_quest
exploration_room 1 : N exploration_record

quest 1 : N room_quest_candidate
quest 1 : N user_quest_history
room_quest_candidate 1 : N vote_item
room_quest_candidate 1 : N final_quest
vote 1 : N vote_item
room_participant 1 : N vote_item
room_participant 1 : N quest_progress
final_quest 1 : N quest_progress
exploration_record 1 : N record_photo
exploration_record 1 : N story_image
story_template 1 : N story_image
retention_stage 1 : N user_retention_stage
```

---

## 5. 테이블 목록

| 테이블명 | 설명 |
| --- | --- |
| `device_user` | 기기 기반 사용자 정보와 닉네임 관리 |
| `region` | 탐험 가능 지역 마스터 |
| `user_recent_region` | 사용자별 최근 선택 지역 |
| `exploration_room` | 탐험방 상태, 방장, 투표/탐험 진행 상태 관리 |
| `exploration_condition` | 지역 외 일정, 시간대, 예산, 음주, 기피 음식 조건 관리 |
| `invite_link` | 탐험방 초대 링크 토큰 관리 |
| `room_participant` | 탐험방 참여자, 닉네임, 역할, 접속/복구/투표 상태 관리 |
| `quest` | 검수된 퀘스트 원본 DB |
| `room_quest_candidate` | 탐험방별 후보 퀘스트 6개 스냅샷 |
| `vote` | 탐험방 투표 상태와 마감 정보 |
| `vote_item` | 참여자별 투표 선택 항목 |
| `final_quest` | 최종 확정 퀘스트 3개와 동점 선택 결과 |
| `quest_progress` | 확정 퀘스트별 참여자 완료 상태 |
| `exploration_record` | 탐험 종료 후 사용자별 기록 |
| `record_photo` | Story 제작용 기록 사진 |
| `story_template` | Story 이미지 템플릿 |
| `story_image` | 생성된 9:16 Story 이미지 |
| `user_quest_history` | 사용자별 완료 퀘스트 이력 |
| `retention_stage` | 재방문 리텐션 단계 마스터 |
| `user_retention_stage` | 사용자별 리텐션 단계 달성 이력 |

---

## 6. meokgo_db 테이블 명세

### 6.1 device_user

**역할:** 로그인 없이 기기 기반 사용자를 식별하고 닉네임과 최초 실행 여부를 관리한다.

| NO | Attribute | Data Type | NN | PK | FK | UQ | Default | Description |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | user_id | BIGINT UNSIGNED | O | O |  |  | AUTO_INC | 사용자 내부 ID |
| 2 | device_key | VARCHAR(100) | O |  |  | O | - | 기기 식별 키 |
| 3 | nickname | VARCHAR(10) | O |  |  |  | - | 사용자 기본 닉네임 |
| 4 | first_launch_yn | TINYINT(1) | O |  |  |  | 1 | 최초 실행 여부 |
| 5 | nickname_updated_at | DATETIME |  |  |  |  | NULL | 닉네임 최종 변경 일시 |
| 6 | created_at | DATETIME | O |  |  |  | CURRENT_TIMESTAMP | 생성 일시 |
| 7 | updated_at | DATETIME | O |  |  |  | CURRENT_TIMESTAMP | 수정 일시 |

### 제약조건

| 종류 | 대상 컬럼 | 설명 |
| --- | --- | --- |
| UNIQUE | device_key | 같은 기기 사용자 중복 생성 방지 |
| INDEX | nickname | 닉네임 검색 또는 표시용 보조 인덱스 |

### 구현 메모

- 같은 기기 복구는 `device_key`로 `device_user`를 찾은 뒤 `room_participant`를 조회하는 방식으로 처리한다.
- 다른 기기에서 기존 참여 내역을 복구하는 기능은 MVP 범위에서 제외한다.

---

### 6.2 region

**역할:** 탐험 지역 선택에 사용하는 지역 마스터를 관리한다.

| NO | Attribute | Data Type | NN | PK | FK | UQ | Default | Description |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | region_id | BIGINT UNSIGNED | O | O |  |  | AUTO_INC | 지역 ID |
| 2 | parent_region_id | BIGINT UNSIGNED |  |  | FK(region) |  | NULL | 상위 지역 ID |
| 3 | region_name | VARCHAR(50) | O |  |  |  | - | 지역명 |
| 4 | region_level | VARCHAR(20) | O |  |  |  | - | 지역 단계 |
| 5 | display_order | INT | O |  |  |  | 0 | 노출 순서 |
| 6 | active_yn | TINYINT(1) | O |  |  |  | 1 | 사용 여부 |
| 7 | created_at | DATETIME | O |  |  |  | CURRENT_TIMESTAMP | 생성 일시 |
| 8 | updated_at | DATETIME | O |  |  |  | CURRENT_TIMESTAMP | 수정 일시 |

### 제약조건

| 종류 | 대상 컬럼 | 설명 |
| --- | --- | --- |
| FK | parent_region_id -> region.region_id | 지역 계층 구조 표현 |
| INDEX | parent_region_id, display_order | 지역 분류 조회 최적화 |
| INDEX | active_yn | 활성 지역 조회 |

---

### 6.3 user_recent_region

**역할:** 사용자가 최근 선택한 탐험 지역을 빠른 선택 영역에 표시하기 위해 저장한다.

| NO | Attribute | Data Type | NN | PK | FK | UQ | Default | Description |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | recent_region_id | BIGINT UNSIGNED | O | O |  |  | AUTO_INC | 최근 지역 ID |
| 2 | user_id | BIGINT UNSIGNED | O |  | FK(device_user) |  | - | 사용자 ID |
| 3 | region_id | BIGINT UNSIGNED | O |  | FK(region) |  | - | 지역 ID |
| 4 | selected_at | DATETIME | O |  |  |  | CURRENT_TIMESTAMP | 선택 일시 |

### 제약조건

| 종류 | 대상 컬럼 | 설명 |
| --- | --- | --- |
| FK | user_id -> device_user.user_id | 사용자 기준 최근 지역 연결 |
| FK | region_id -> region.region_id | 선택 지역 연결 |
| INDEX | user_id, selected_at | 사용자별 최근 지역 조회 |

---

### 6.4 exploration_room

**역할:** 탐험방의 방장, 지역, 상태, 투표/탐험 진행 일시, 방장 권한 이어받기 가능 시점을 관리한다.

| NO | Attribute | Data Type | NN | PK | FK | UQ | Default | Description |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | room_id | BIGINT UNSIGNED | O | O |  |  | AUTO_INC | 탐험방 ID |
| 2 | host_user_id | BIGINT UNSIGNED | O |  | FK(device_user) |  | - | 방장 사용자 ID |
| 3 | region_id | BIGINT UNSIGNED | O |  | FK(region) |  | - | 탐험 지역 ID |
| 4 | room_code | VARCHAR(20) | O |  |  | O | - | 화면 표시용 방 코드 |
| 5 | room_status | ENUM('WAITING','VOTING','VOTE_CLOSED','QUEST_CONFIRMED','IN_PROGRESS','FINISHED','EXPIRED') | O |  |  |  | 'WAITING' | 탐험방 상태 |
| 6 | max_participant_count | INT | O |  |  |  | 4 | 최대 참여 인원 |
| 7 | vote_started_at | DATETIME |  |  |  |  | NULL | 투표 시작 일시 |
| 8 | vote_closed_at | DATETIME |  |  |  |  | NULL | 투표 마감 일시 |
| 9 | vote_reopened_yn | TINYINT(1) | O |  |  |  | 0 | MVP에서는 항상 0 |
| 10 | last_host_action_at | DATETIME |  |  |  |  | NULL | 방장 마지막 진행 액션 일시 |
| 11 | host_takeover_available_at | DATETIME |  |  |  |  | NULL | 권한 이어받기 가능 일시 |
| 12 | exploration_started_at | DATETIME |  |  |  |  | NULL | 탐험 시작 일시 |
| 13 | exploration_finished_at | DATETIME |  |  |  |  | NULL | 탐험 종료 일시 |
| 14 | expired_at | DATETIME | O |  |  |  | 생성일시 + 24시간 | 탐험방 만료 일시 |
| 15 | created_at | DATETIME | O |  |  |  | CURRENT_TIMESTAMP | 생성 일시 |
| 16 | updated_at | DATETIME | O |  |  |  | CURRENT_TIMESTAMP | 수정 일시 |

### 제약조건

| 종류 | 대상 컬럼 | 설명 |
| --- | --- | --- |
| FK | host_user_id -> device_user.user_id | 방장 사용자 연결 |
| FK | region_id -> region.region_id | 탐험 지역 연결 |
| UNIQUE | room_code | 방 코드 중복 방지 |
| INDEX | room_status, updated_at | 홈 화면 진행 중 탐험 조회 |

### 구현 메모

- 방장이 앱을 종료했다가 다시 접속해도 `room_status`가 종료 상태가 아니면 탐험방은 유지한다.
- 투표 시작 이후에는 초대 링크 참여 API에서 신규 참여를 차단한다.
- 방장 권한 이어받기 버튼은 `last_host_action_at` 이후 5분이 지나면 활성화한다.
- `host_takeover_available_at`은 `last_host_action_at + 5분`으로 산정한다.
- 탐험방은 생성 후 24시간이 지나면 `room_status = 'EXPIRED'`로 전환한다.

---

### 6.5 exploration_condition

**역할:** 탐험방 생성 시 선택한 탐험 조건을 관리한다.

| NO | Attribute | Data Type | NN | PK | FK | UQ | Default | Description |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | condition_id | BIGINT UNSIGNED | O | O |  |  | AUTO_INC | 탐험 조건 ID |
| 2 | room_id | BIGINT UNSIGNED | O |  | FK(exploration_room) | O | - | 탐험방 ID |
| 3 | schedule_type | ENUM('MEAL','CAFE','PUB','SECOND_ROUND') | O |  |  |  | - | 일정 유형 |
| 4 | time_slot | ENUM('LUNCH','DINNER','LATE_NIGHT','ANY') |  |  |  |  | NULL | 시간대 |
| 5 | budget_min | INT |  |  |  |  | NULL | 최소 예산 |
| 6 | budget_max | INT |  |  |  |  | NULL | 최대 예산 |
| 7 | drinking_option | ENUM('NONE','AVAILABLE','ANY') | O |  |  |  | 'ANY' | 음주 여부 |
| 8 | avoid_foods | VARCHAR(500) |  |  |  |  | NULL | 기피 음식 |
| 9 | created_at | DATETIME | O |  |  |  | CURRENT_TIMESTAMP | 생성 일시 |
| 10 | updated_at | DATETIME | O |  |  |  | CURRENT_TIMESTAMP | 수정 일시 |

### 제약조건

| 종류 | 대상 컬럼 | 설명 |
| --- | --- | --- |
| FK | room_id -> exploration_room.room_id | 탐험방 조건 연결 |
| UNIQUE | room_id | 탐험방당 조건 1건 관리 |

---

### 6.6 invite_link

**역할:** 탐험방 초대 링크 토큰과 만료 여부를 관리한다.

| NO | Attribute | Data Type | NN | PK | FK | UQ | Default | Description |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | invite_link_id | BIGINT UNSIGNED | O | O |  |  | AUTO_INC | 초대 링크 ID |
| 2 | room_id | BIGINT UNSIGNED | O |  | FK(exploration_room) |  | - | 탐험방 ID |
| 3 | invite_token | VARCHAR(100) | O |  |  | O | - | 초대 토큰 |
| 4 | active_yn | TINYINT(1) | O |  |  |  | 1 | 사용 여부 |
| 5 | expired_at | DATETIME | O |  |  |  | 생성일시 + 24시간 | 만료 일시 |
| 6 | created_at | DATETIME | O |  |  |  | CURRENT_TIMESTAMP | 생성 일시 |

### 제약조건

| 종류 | 대상 컬럼 | 설명 |
| --- | --- | --- |
| FK | room_id -> exploration_room.room_id | 탐험방 초대 링크 연결 |
| UNIQUE | invite_token | 초대 토큰 중복 방지 |
| INDEX | active_yn, expired_at | 참여 가능 링크 조회 |

### 구현 메모

- 초대 링크는 생성 후 24시간 동안 유효하다.
- 연결된 탐험방이 먼저 `EXPIRED`, `VOTING`, `VOTE_CLOSED`, `QUEST_CONFIRMED`, `IN_PROGRESS`, `FINISHED` 상태가 되면 링크가 만료 전이어도 신규 참여를 차단한다.

---

### 6.7 room_participant

**역할:** 탐험방 참여자, 방장/참여자 역할, 방 안 닉네임, 접속 상태, 투표 복구 상태를 관리한다.

| NO | Attribute | Data Type | NN | PK | FK | UQ | Default | Description |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | participant_id | BIGINT UNSIGNED | O | O |  |  | AUTO_INC | 참여자 ID |
| 2 | room_id | BIGINT UNSIGNED | O |  | FK(exploration_room) |  | - | 탐험방 ID |
| 3 | user_id | BIGINT UNSIGNED | O |  | FK(device_user) |  | - | 사용자 ID |
| 4 | nickname | VARCHAR(10) | O |  |  |  | - | 탐험방 참여 닉네임 |
| 5 | participant_role | ENUM('HOST','MEMBER') | O |  |  |  | 'MEMBER' | 참여자 역할 |
| 6 | participant_status | ENUM('WAITING','VOTING','READY','EXPLORING','FINISHED','LEFT') | O |  |  |  | 'WAITING' | 참여 상태 |
| 7 | avatar_color | VARCHAR(20) |  |  |  |  | NULL | 기본 아바타 색상 |
| 8 | restored_from_device_yn | TINYINT(1) | O |  |  |  | 0 | 같은 기기 재접속 복구 여부 |
| 9 | vote_submitted_yn | TINYINT(1) | O |  |  |  | 0 | 투표 제출 여부 |
| 10 | vote_submitted_at | DATETIME |  |  |  |  | NULL | 최초 투표 제출 일시 |
| 11 | vote_updated_at | DATETIME |  |  |  |  | NULL | 마지막 투표 수정 일시 |
| 12 | last_connected_at | DATETIME |  |  |  |  | NULL | 마지막 접속 일시 |
| 13 | joined_at | DATETIME | O |  |  |  | CURRENT_TIMESTAMP | 참여 일시 |
| 14 | left_at | DATETIME |  |  |  |  | NULL | 이탈 일시 |

### 제약조건

| 종류 | 대상 컬럼 | 설명 |
| --- | --- | --- |
| FK | room_id -> exploration_room.room_id | 참여 탐험방 연결 |
| FK | user_id -> device_user.user_id | 기기 사용자 연결 |
| UNIQUE | room_id, user_id | 같은 기기의 같은 방 중복 참여 방지 |
| UNIQUE | room_id, nickname | 같은 탐험방 내 닉네임 중복 방지 |
| INDEX | room_id, participant_status | 대기/투표/탐험 화면 참여자 목록 조회 |
| INDEX | room_id, user_id, participant_status | 같은 기기 참여 상태 복구 |

### 구현 메모

- 같은 기기 재접속 시 `room_id`, `user_id`, `participant_status` 기준으로 기존 참여 상태를 복구한다.
- 투표 내역 복구는 `vote_item`과 함께 조회한다.

---

### 6.8 quest

**역할:** 검수된 퀘스트 원본 데이터를 관리한다.

| NO | Attribute | Data Type | NN | PK | FK | UQ | Default | Description |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | quest_id | BIGINT UNSIGNED | O | O |  |  | AUTO_INC | 퀘스트 ID |
| 2 | quest_title | VARCHAR(100) | O |  |  |  | - | 퀘스트명 |
| 3 | quest_description | VARCHAR(500) | O |  |  |  | - | 퀘스트 설명 |
| 4 | quest_type | ENUM('COMMON','LOCAL','COOPERATIVE','TRANSITION','REVISIT') | O |  |  |  | - | 퀘스트 유형 |
| 5 | schedule_type | ENUM('MEAL','CAFE','PUB','SECOND_ROUND') | O |  |  |  | - | 적용 일정 |
| 6 | time_slot | ENUM('LUNCH','DINNER','LATE_NIGHT','ANY') |  |  |  |  | NULL | 적용 시간대 |
| 7 | drinking_option | ENUM('NONE','AVAILABLE','ANY') |  |  |  |  | NULL | 적용 음주 조건 |
| 8 | budget_min | INT |  |  |  |  | NULL | 권장 최소 예산 |
| 9 | budget_max | INT |  |  |  |  | NULL | 권장 최대 예산 |
| 10 | food_keywords | VARCHAR(500) |  |  |  |  | NULL | 음식 키워드 |
| 11 | excluded_keywords | VARCHAR(500) |  |  |  |  | NULL | 기피 음식 충돌 판단 키워드 |
| 12 | region_specific_yn | TINYINT(1) | O |  |  |  | 0 | 지역 특화 여부 |
| 13 | forced_preference_yn | TINYINT(1) | O |  |  |  | 0 | 호불호 강요 요소 여부 |
| 14 | risky_competition_yn | TINYINT(1) | O |  |  |  | 0 | 맵기/음주량 경쟁 요소 여부 |
| 15 | activity_yn | TINYINT(1) | O |  |  |  | 0 | 활동형 퀘스트 여부 |
| 16 | active_yn | TINYINT(1) | O |  |  |  | 1 | 사용 여부 |
| 17 | created_at | DATETIME | O |  |  |  | CURRENT_TIMESTAMP | 생성 일시 |
| 18 | updated_at | DATETIME | O |  |  |  | CURRENT_TIMESTAMP | 수정 일시 |

### 제약조건

| 종류 | 대상 컬럼 | 설명 |
| --- | --- | --- |
| INDEX | schedule_type, drinking_option, active_yn | 조건 기반 후보 필터링 |
| INDEX | quest_type, region_specific_yn | 균형 조합 후보 선정 |
| INDEX | active_yn | 사용 가능 퀘스트 조회 |

### 구현 메모

- 조건 퀘스트가 부족하면 `quest_type = 'COMMON'`인 범용 퀘스트로 보충한다.
- 범용 퀘스트까지 포함해도 후보가 3개 미만이면 조건 재설정 안내를 반환한다.
- 후보는 탐험방 단위로 중복 없이 6개를 목표로 선정한다.

---

### 6.9 room_quest_candidate

**역할:** 탐험방별 후보 퀘스트 6개를 스냅샷으로 저장한다.

| NO | Attribute | Data Type | NN | PK | FK | UQ | Default | Description |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | candidate_id | BIGINT UNSIGNED | O | O |  |  | AUTO_INC | 후보 퀘스트 ID |
| 2 | room_id | BIGINT UNSIGNED | O |  | FK(exploration_room) |  | - | 탐험방 ID |
| 3 | quest_id | BIGINT UNSIGNED | O |  | FK(quest) |  | - | 퀘스트 ID |
| 4 | candidate_order | INT | O |  |  |  | - | 후보 노출 순서 |
| 5 | selected_reason | VARCHAR(200) |  |  |  |  | NULL | 후보 선정 사유 |
| 6 | suppressed_by_history_yn | TINYINT(1) | O |  |  |  | 0 | 이전 완료 이력으로 노출 축소 대상 여부 |
| 7 | created_at | DATETIME | O |  |  |  | CURRENT_TIMESTAMP | 생성 일시 |

### 제약조건

| 종류 | 대상 컬럼 | 설명 |
| --- | --- | --- |
| FK | room_id -> exploration_room.room_id | 탐험방 후보 연결 |
| FK | quest_id -> quest.quest_id | 원본 퀘스트 연결 |
| UNIQUE | room_id, quest_id | 같은 탐험방 내 후보 퀘스트 중복 방지 |
| UNIQUE | room_id, candidate_order | 후보 노출 순서 중복 방지 |
| INDEX | room_id, candidate_order | 투표 화면 후보 조회 |

---

### 6.10 vote

**역할:** 탐험방 투표 상태, 선택 개수, 마감 확인 정보를 관리한다.

| NO | Attribute | Data Type | NN | PK | FK | UQ | Default | Description |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | vote_id | BIGINT UNSIGNED | O | O |  |  | AUTO_INC | 투표 ID |
| 2 | room_id | BIGINT UNSIGNED | O |  | FK(exploration_room) | O | - | 탐험방 ID |
| 3 | vote_status | ENUM('OPEN','CLOSED') | O |  |  |  | 'OPEN' | 투표 상태 |
| 4 | min_select_count | INT | O |  |  |  | 1 | 최소 선택 개수 |
| 5 | max_select_count | INT | O |  |  |  | 3 | 최대 선택 개수 |
| 6 | not_voted_count_at_close | INT |  |  |  |  | NULL | 마감 시점 미투표 인원 |
| 7 | close_confirmed_yn | TINYINT(1) | O |  |  |  | 0 | 확인창 승인 후 마감 여부 |
| 8 | started_at | DATETIME | O |  |  |  | CURRENT_TIMESTAMP | 투표 시작 일시 |
| 9 | closed_at | DATETIME |  |  |  |  | NULL | 투표 종료 일시 |

### 제약조건

| 종류 | 대상 컬럼 | 설명 |
| --- | --- | --- |
| FK | room_id -> exploration_room.room_id | 탐험방 투표 연결 |
| UNIQUE | room_id | 탐험방당 투표 1건 관리 |
| INDEX | vote_status | 열린 투표와 마감 투표 조회 |

### 구현 메모

- 마감 요청 시 `close_confirmed_yn = 1`이어야 실제 마감한다.
- MVP에서는 마감 후 재오픈을 지원하지 않는다.

---

### 6.11 vote_item

**역할:** 참여자가 선택한 후보 퀘스트 투표 항목을 저장한다.

| NO | Attribute | Data Type | NN | PK | FK | UQ | Default | Description |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | vote_item_id | BIGINT UNSIGNED | O | O |  |  | AUTO_INC | 투표 항목 ID |
| 2 | vote_id | BIGINT UNSIGNED | O |  | FK(vote) |  | - | 투표 ID |
| 3 | participant_id | BIGINT UNSIGNED | O |  | FK(room_participant) |  | - | 참여자 ID |
| 4 | candidate_id | BIGINT UNSIGNED | O |  | FK(room_quest_candidate) |  | - | 후보 퀘스트 ID |
| 5 | voted_at | DATETIME | O |  |  |  | CURRENT_TIMESTAMP | 최초 투표 일시 |
| 6 | updated_at | DATETIME | O |  |  |  | CURRENT_TIMESTAMP | 투표 수정 일시 |

### 제약조건

| 종류 | 대상 컬럼 | 설명 |
| --- | --- | --- |
| FK | vote_id -> vote.vote_id | 투표 연결 |
| FK | participant_id -> room_participant.participant_id | 참여자 연결 |
| FK | candidate_id -> room_quest_candidate.candidate_id | 후보 퀘스트 연결 |
| UNIQUE | vote_id, participant_id, candidate_id | 동일 후보 중복 선택 방지 |
| INDEX | vote_id, candidate_id | 퀘스트별 득표수 집계 |

---

### 6.12 final_quest

**역할:** 투표 결과로 확정된 최종 퀘스트와 동점 시 방장 선택 결과를 관리한다.

| NO | Attribute | Data Type | NN | PK | FK | UQ | Default | Description |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | final_quest_id | BIGINT UNSIGNED | O | O |  |  | AUTO_INC | 확정 퀘스트 ID |
| 2 | room_id | BIGINT UNSIGNED | O |  | FK(exploration_room) |  | - | 탐험방 ID |
| 3 | candidate_id | BIGINT UNSIGNED | O |  | FK(room_quest_candidate) |  | - | 후보 퀘스트 ID |
| 4 | rank_no | INT | O |  |  |  | - | 확정 순위 |
| 5 | vote_count | INT | O |  |  |  | 0 | 득표수 |
| 6 | tie_break_order | INT |  |  |  |  | NULL | 동점 처리 순서 |
| 7 | selected_by_host_participant_id | BIGINT UNSIGNED |  |  | FK(room_participant) |  | NULL | 동점 시 선택한 방장 참여자 ID |
| 8 | tie_group_no | INT |  |  |  |  | NULL | 동점 후보 그룹 번호 |
| 9 | selection_reason | ENUM('VOTE_RANK','HOST_TIE_BREAK') |  |  |  |  | NULL | 확정 사유 |
| 10 | confirmed_at | DATETIME | O |  |  |  | CURRENT_TIMESTAMP | 확정 일시 |

### 제약조건

| 종류 | 대상 컬럼 | 설명 |
| --- | --- | --- |
| FK | room_id -> exploration_room.room_id | 탐험방 확정 퀘스트 연결 |
| FK | candidate_id -> room_quest_candidate.candidate_id | 후보 퀘스트 연결 |
| FK | selected_by_host_participant_id -> room_participant.participant_id | 동점 선택 방장 연결 |
| UNIQUE | room_id, candidate_id | 같은 후보 중복 확정 방지 |
| UNIQUE | room_id, rank_no | 확정 순위 중복 방지 |
| INDEX | room_id, tie_group_no | 동점 후보 조회 |

### 구현 메모

- 최종 3개 선정 과정에서 동점이 발생하면 자동 재투표하지 않는다.
- 방장이 동점 후보 중 필요한 개수만 직접 선택하고 `selection_reason = 'HOST_TIE_BREAK'`로 저장한다.

---

### 6.13 quest_progress

**역할:** 확정 퀘스트별 참여자 완료 상태를 관리한다.

| NO | Attribute | Data Type | NN | PK | FK | UQ | Default | Description |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | progress_id | BIGINT UNSIGNED | O | O |  |  | AUTO_INC | 진행 상태 ID |
| 2 | final_quest_id | BIGINT UNSIGNED | O |  | FK(final_quest) |  | - | 확정 퀘스트 ID |
| 3 | participant_id | BIGINT UNSIGNED | O |  | FK(room_participant) |  | - | 참여자 ID |
| 4 | progress_status | ENUM('TODO','DONE','CANCELED') | O |  |  |  | 'TODO' | 완료 상태 |
| 5 | completed_at | DATETIME |  |  |  |  | NULL | 완료 일시 |
| 6 | updated_at | DATETIME | O |  |  |  | CURRENT_TIMESTAMP | 수정 일시 |

### 제약조건

| 종류 | 대상 컬럼 | 설명 |
| --- | --- | --- |
| FK | final_quest_id -> final_quest.final_quest_id | 확정 퀘스트 연결 |
| FK | participant_id -> room_participant.participant_id | 참여자 연결 |
| UNIQUE | final_quest_id, participant_id | 참여자별 퀘스트 진행 상태 1건 관리 |
| INDEX | final_quest_id, progress_status | 퀘스트 완료 현황 조회 |

---

### 6.14 exploration_record

**역할:** 탐험 종료 후 사용자별 완료 기록과 Story 선택 여부를 관리한다.

| NO | Attribute | Data Type | NN | PK | FK | UQ | Default | Description |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | record_id | BIGINT UNSIGNED | O | O |  |  | AUTO_INC | 탐험 기록 ID |
| 2 | room_id | BIGINT UNSIGNED | O |  | FK(exploration_room) |  | - | 탐험방 ID |
| 3 | user_id | BIGINT UNSIGNED | O |  | FK(device_user) |  | - | 사용자 ID |
| 4 | region_id | BIGINT UNSIGNED | O |  | FK(region) |  | - | 탐험 지역 ID |
| 5 | participant_count | INT | O |  |  |  | 0 | 참여 인원 |
| 6 | completed_quest_count | INT | O |  |  |  | 0 | 완료 퀘스트 수 |
| 7 | record_memo | VARCHAR(500) |  |  |  |  | NULL | 기록 메모 |
| 8 | story_selected_yn | TINYINT(1) | O |  |  |  | 0 | Story 제작 선택 여부 |
| 9 | created_at | DATETIME | O |  |  |  | CURRENT_TIMESTAMP | 기록 생성 일시 |

### 제약조건

| 종류 | 대상 컬럼 | 설명 |
| --- | --- | --- |
| FK | room_id -> exploration_room.room_id | 종료 탐험방 연결 |
| FK | user_id -> device_user.user_id | 기록 소유 사용자 연결 |
| FK | region_id -> region.region_id | 탐험 지역 연결 |
| INDEX | user_id, created_at | 내 기록 목록 조회 |

---

### 6.15 record_photo

**역할:** Story 제작을 선택한 사용자의 사진을 관리한다.

| NO | Attribute | Data Type | NN | PK | FK | UQ | Default | Description |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | photo_id | BIGINT UNSIGNED | O | O |  |  | AUTO_INC | 사진 ID |
| 2 | record_id | BIGINT UNSIGNED | O |  | FK(exploration_record) |  | - | 탐험 기록 ID |
| 3 | photo_url | VARCHAR(500) | O |  |  |  | - | 사진 URL |
| 4 | photo_order | INT | O |  |  |  | - | 사진 순서 |
| 5 | storage_provider | ENUM('LOCAL','S3') | O |  |  |  | 'S3' | 저장 위치 |
| 6 | stored_path | VARCHAR(500) | O |  |  |  | - | 저장소 내부 경로 |
| 7 | expired_at | DATETIME | O |  |  |  | 생성일시 + 30일 | 보관 만료 일시 |
| 8 | deleted_yn | TINYINT(1) | O |  |  |  | 0 | 삭제 여부 |
| 9 | created_at | DATETIME | O |  |  |  | CURRENT_TIMESTAMP | 생성 일시 |

### 제약조건

| 종류 | 대상 컬럼 | 설명 |
| --- | --- | --- |
| FK | record_id -> exploration_record.record_id | 탐험 기록 사진 연결 |
| UNIQUE | record_id, photo_order | 사진 순서 중복 방지 |

### 구현 메모

- 사진은 퀘스트 인증이 아니며, Story 제작 선택 시에만 저장한다.
- 사진 선택 정책은 최소 1장, 최대 4장이다.
- Story 제작용 사진은 업로드 후 30일 동안 보관한다.

---

### 6.16 story_template

**역할:** 기록 이미지 생성에 사용할 템플릿을 관리한다.

| NO | Attribute | Data Type | NN | PK | FK | UQ | Default | Description |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | template_id | BIGINT UNSIGNED | O | O |  |  | AUTO_INC | 템플릿 ID |
| 2 | template_name | VARCHAR(50) | O |  |  |  | - | 템플릿명 |
| 3 | preview_url | VARCHAR(500) | O |  |  |  | - | 미리보기 이미지 URL |
| 4 | active_yn | TINYINT(1) | O |  |  |  | 1 | 사용 여부 |
| 5 | display_order | INT | O |  |  |  | 0 | 노출 순서 |
| 6 | created_at | DATETIME | O |  |  |  | CURRENT_TIMESTAMP | 생성 일시 |

---

### 6.17 story_image

**역할:** 생성된 9:16 Story 이미지를 관리한다.

| NO | Attribute | Data Type | NN | PK | FK | UQ | Default | Description |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | story_image_id | BIGINT UNSIGNED | O | O |  |  | AUTO_INC | Story 이미지 ID |
| 2 | record_id | BIGINT UNSIGNED | O |  | FK(exploration_record) |  | - | 탐험 기록 ID |
| 3 | template_id | BIGINT UNSIGNED | O |  | FK(story_template) |  | - | 템플릿 ID |
| 4 | story_image_url | VARCHAR(500) | O |  |  |  | - | 생성 이미지 URL |
| 5 | image_ratio | VARCHAR(10) | O |  |  |  | '9:16' | 결과 공유 카드 비율 |
| 6 | storage_provider | ENUM('LOCAL','S3') | O |  |  |  | 'S3' | 저장 위치 |
| 7 | stored_path | VARCHAR(500) | O |  |  |  | - | 저장소 내부 경로 |
| 8 | expired_at | DATETIME | O |  |  |  | 생성일시 + 30일 | 보관 만료 일시 |
| 9 | deleted_yn | TINYINT(1) | O |  |  |  | 0 | 삭제 여부 |
| 10 | created_at | DATETIME | O |  |  |  | CURRENT_TIMESTAMP | 생성 일시 |

### 구현 메모

- Story 이미지는 S3 저장을 우선으로 한다.
- 초기 개발 상황에 따라 서버 로컬 저장을 허용하되, `storage_provider`로 구분한다.
- Story 이미지는 생성 후 30일 동안 보관한다.
- 보관 기간이 지난 이미지는 배치로 삭제하고 `deleted_yn = 1`로 표시한다.

---

### 6.18 user_quest_history

**역할:** 이전 완료 퀘스트 재노출 축소와 사용자 통계 계산을 위한 완료 이력을 관리한다.

| NO | Attribute | Data Type | NN | PK | FK | UQ | Default | Description |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | history_id | BIGINT UNSIGNED | O | O |  |  | AUTO_INC | 퀘스트 이력 ID |
| 2 | user_id | BIGINT UNSIGNED | O |  | FK(device_user) |  | - | 사용자 ID |
| 3 | quest_id | BIGINT UNSIGNED | O |  | FK(quest) |  | - | 퀘스트 ID |
| 4 | room_id | BIGINT UNSIGNED | O |  | FK(exploration_room) |  | - | 탐험방 ID |
| 5 | completed_at | DATETIME | O |  |  |  | CURRENT_TIMESTAMP | 완료 일시 |

---

### 6.19 retention_stage

**역할:** 반복 사용을 위한 리텐션 단계와 보상 설명을 관리한다.

| NO | Attribute | Data Type | NN | PK | FK | UQ | Default | Description |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | stage_id | BIGINT UNSIGNED | O | O |  |  | AUTO_INC | 단계 ID |
| 2 | stage_code | VARCHAR(30) | O |  |  | O | - | 단계 코드 |
| 3 | stage_name | VARCHAR(50) | O |  |  |  | - | 단계명 |
| 4 | achievement_condition | VARCHAR(300) | O |  |  |  | - | 달성 조건 |
| 5 | reward_description | VARCHAR(300) | O |  |  |  | - | 제공 보상 |
| 6 | display_order | INT | O |  |  |  | 0 | 노출 순서 |
| 7 | active_yn | TINYINT(1) | O |  |  |  | 1 | 사용 여부 |

---

### 6.20 user_retention_stage

**역할:** 사용자별 리텐션 단계 달성 이력을 관리한다.

| NO | Attribute | Data Type | NN | PK | FK | UQ | Default | Description |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | user_stage_id | BIGINT UNSIGNED | O | O |  |  | AUTO_INC | 사용자 단계 ID |
| 2 | user_id | BIGINT UNSIGNED | O |  | FK(device_user) |  | - | 사용자 ID |
| 3 | stage_id | BIGINT UNSIGNED | O |  | FK(retention_stage) |  | - | 단계 ID |
| 4 | region_id | BIGINT UNSIGNED |  |  | FK(region) |  | NULL | 지역 기반 단계일 경우 지역 ID |
| 5 | achieved_at | DATETIME | O |  |  |  | CURRENT_TIMESTAMP | 달성 일시 |

---

## 7. 주요 Enum

| 이름 | 값 |
| --- | --- |
| `room_status` | `WAITING`, `VOTING`, `VOTE_CLOSED`, `QUEST_CONFIRMED`, `IN_PROGRESS`, `FINISHED`, `EXPIRED` |
| `participant_role` | `HOST`, `MEMBER` |
| `participant_status` | `WAITING`, `VOTING`, `READY`, `EXPLORING`, `FINISHED`, `LEFT` |
| `schedule_type` | `MEAL`, `CAFE`, `PUB`, `SECOND_ROUND` |
| `time_slot` | `LUNCH`, `DINNER`, `LATE_NIGHT`, `ANY` |
| `drinking_option` | `NONE`, `AVAILABLE`, `ANY` |
| `quest_type` | `COMMON`, `LOCAL`, `COOPERATIVE`, `TRANSITION`, `REVISIT` |
| `vote_status` | `OPEN`, `CLOSED` |
| `final_quest_selection_reason` | `VOTE_RANK`, `HOST_TIE_BREAK` |
| `progress_status` | `TODO`, `DONE`, `CANCELED` |
| `retention_stage` | `FIRST_DISCOVERY`, `ALLEY_EXPLORER`, `REGION_MASTER` |
| `storage_provider` | `LOCAL`, `S3` |

---

## 8. 핵심 정책 요약

| 정책 | 내용 |
| --- | --- |
| 탐험방 유지 | 방장이 앱을 종료해도 진행 중인 탐험방은 유지한다. |
| 참여 상태 복구 | 같은 기기 재접속 시 기존 참여 상태와 투표 내역을 복구한다. |
| 다른 기기 복구 | MVP에서는 제외한다. |
| 닉네임 중복 | 같은 탐험방 안에서 중복 불가하다. |
| 후보 퀘스트 | 조건 기반으로 중복 없이 6개 제공한다. |
| 후보 부족 | 조건 후보가 부족하면 범용 퀘스트로 보충한다. |
| 조건 재설정 | 범용 포함 3개 미만이면 조건 재설정을 안내한다. |
| 투표 시작 | 방장만 시작할 수 있고, 시작 후 신규 참여를 차단한다. |
| 투표 수정 | 마감 전까지 본인 투표 수정 가능하다. |
| 투표 마감 | 미투표자가 있어도 방장이 확인창 승인 후 마감할 수 있다. |
| 투표 재오픈 | MVP에서는 제외한다. |
| 동점 처리 | 방장이 동점 후보 중 직접 선택한다. |
| 방장 이탈 | 방장 마지막 진행 액션 이후 5분 동안 추가 진행이 없으면 참여자가 권한 이어받기 버튼으로 요청한다. |
| 알림 | 푸시 알림은 제외하고 앱 내부 상태 표시로 대체한다. |
| 초대 링크 만료 | 초대 링크는 생성 후 24시간 동안 유효하다. |
| 탐험방 만료 | 탐험방은 생성 후 24시간이 지나면 만료 처리한다. |
| 실시간 처리 | MVP에서는 HTTP 폴링을 사용한다. |
| Story 저장 위치 | S3 저장을 우선으로 하며, 초기 개발 상황에 따라 서버 로컬 저장을 허용한다. |
| Story 보관 기간 | Story 이미지와 Story 제작용 사진은 생성 후 30일 동안 보관한다. |
| 초기 운영 데이터 | 초기 지역은 홍대, 성수, 망원 3개이며, 지역별 퀘스트 최소 10개와 범용 퀘스트 최소 10개를 준비한다. |

---

## 9. 초기 운영 데이터 기준

MVP 테스트와 초기 운영을 위해 아래 데이터를 먼저 준비한다.

| 구분 | 기준 |
| --- | --- |
| 초기 지역 | 홍대, 성수, 망원 |
| 지역별 퀘스트 | 지역별 최소 10개 |
| 범용 퀘스트 | 최소 10개 |
| 퀘스트 후보 제공 | 조건 기반 6개 |
| 후보 부족 보충 | 지역별 후보 부족 시 범용 퀘스트로 보충 |
| 조건 재설정 안내 | 범용 퀘스트까지 포함해도 후보 3개 미만이면 조건 재설정 안내 |

초기 지역은 홍대, 성수, 망원으로 확정한다. 각 지역별 퀘스트 문구는 운영 데이터로 별도 확정한다.

---

## 10. 추후 보완 후보

- S3 사용 확정 시 버킷명, 접근 URL 정책, 만료 파일 삭제 배치 확정
- 지역별 퀘스트 운영 문구와 검수 기준 확정
