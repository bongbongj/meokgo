# 먹으러GO 서버

> Spring Boot 중심 API 서버
>
> React Native 호스트 앱, React 웹 참여자 페이지가 공통으로 사용하는 백엔드다.

## 실행 전 준비

- Java 21 이상
- MySQL 8.0
- 데이터베이스명: `meokgo_db`

## 환경 변수

| 이름 | 기본값 | 설명 |
| --- | --- | --- |
| `SERVER_PORT` | `8080` | 서버 포트 |
| `DB_URL` | `jdbc:mysql://localhost:3306/meokgo_db?serverTimezone=Asia/Seoul&characterEncoding=UTF-8` | MySQL 연결 URL |
| `DB_USERNAME` | `root` | DB 사용자 |
| `DB_PASSWORD` | `meokgo` | DB 비밀번호 |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:3000,http://localhost:5173,http://localhost:8081` | 허용할 프론트 개발 서버 Origin |

루트의 `docker-compose.yml`로 MySQL을 실행하면 기본 비밀번호는 `meokgo`다.

## 실행

```bash
./gradlew bootRun
```

MySQL 접속 설정 전 Swagger 화면만 먼저 확인하려면 H2 로컬 프로필로 실행한다.

```bash
SPRING_PROFILES_ACTIVE=local-h2 ./gradlew bootRun
```

## 테스트

```bash
./gradlew test
```

## 헬스체크

```bash
curl -H "X-Device-Key: local-device" http://localhost:8080/api/v1/health
```

## Swagger

```text
http://localhost:8080/swagger-ui
```

`Authorize` 버튼에서 `X-Device-Key` 값을 입력하면 Swagger 요청에 기기 식별 헤더가 포함된다.

## 현재 세팅 범위

- 공통 성공 응답 `ApiResponse`
- 공통 오류 응답 `ErrorResponse`
- API 명세서 기준 오류 코드 `ErrorCode`
- 비즈니스 예외 `BusinessException`
- 전역 예외 처리 `GlobalExceptionHandler`
- `X-Device-Key` 컨트롤러 파라미터 처리
- `device_user` 엔티티
- 앱 실행 정보 조회 API
- 닉네임 최초 설정 API
- 닉네임 변경 API
- `region`, `user_recent_region` 엔티티
- 지역 검색 및 분류 조회 API
- 최근 선택 지역 조회 API
- React Native, React 웹 개발 서버용 CORS 기본값
- Swagger UI

## 조건 기반 퀘스트 후보 생성

`reference/API명세서.md`와 `reference/DB설계서.md`의 확정 정책을 따른다.

1. `POST /api/v1/food-preferences/preview`에 자유 입력한 `avoid_foods`를 전달한다.
2. 인식된 기피 키워드와 미해석 표현을 확인하고 필요하면 원문을 수정한다.
3. 기존 방 생성 API에 원문을 전달하면 서버가 다시 해석하여 원문·표준 키워드·사전 버전을 저장한다.
4. 방장이 `POST /api/v1/rooms/{room_id}/quest-candidates`를 호출하면 일정·시간대·음주·기피 음식 조건으로 후보를 선정한다. `X-Device-Key` 헤더가 필요하다.
5. 현재 참여자 전체의 퀘스트별 완료 경험자 수가 0명인 그룹부터 인원수 오름차순으로 그룹 내 무작위 선정한다. 최대 6개를 저장하며 재요청에서는 같은 후보와 순서를 반환한다.

기피 음식 사전은 `src/main/resources/food-dictionary.properties`에서 관리한다. `version`, `aliases.표준키워드`, `children.상위분류`를 함께 관리하고, 변경 시 버전을 올린다. 지원하지 않는 문장·음식이나 모호한 표현은 확인 대상으로 반환하며, 방 생성에서는 `COMMON-001`과 `avoid_foods` 필드 오류를 반환한다.

예산 필드는 요청 및 엔티티에서 제거했다. 후보 생성 응답의 완료 이력 보충 여부는 `filled_with_history_quest`로 반환한다. 후보 조회는 현재 참여자에게만 허용한다.

빈 퀘스트 DB에는 일정별 동작 확인용 예시 데이터를 등록한다. 지역 3개는 개발용 예시이며 등록된 다른 활성 지역에서도 같은 후보 선정 로직을 사용한다. 퀘스트가 이미 있으면 초기 데이터를 덮어쓰거나 추가하지 않는다. 실제 운영 퀘스트는 별도 검수하여 등록한다.

사용자 완료 이력 엔티티와 조회 기능을 추가했다. 실제 탐험 완료 시 이력을 생성하는 연결은 이후 탐험 진행·종료 API 구현에서 처리한다.

기존 MySQL 데이터가 있는 환경은 [DB 변경 안내](DB변경안내.md)를 먼저 확인한다.

허용 표현은 기피 음식 오인을 방지하기 위해 내부에서만 구별한다. 예를 들어 `새우는 괜찮고 고수는 싫어요`의 기피 결과에는 `고수`만 포함되며, 허용 키워드를 응답하거나 저장하지 않는다.

## 투표 마감과 최종 퀘스트 확정

1. 방장이 후보 생성 후 기존 투표 시작 API를 호출한다.
2. 참여자는 투표 저장·수정과 `GET /api/v1/rooms/{room_id}/votes/status`로 진행 상황을 확인한다.
3. 방장은 `GET /api/v1/rooms/{room_id}/votes/close-preview`로 미투표 인원을 확인하고, `POST /api/v1/rooms/{room_id}/votes/close`에 `{"confirmed": true}`를 전달한다.
4. `GET /api/v1/rooms/{room_id}/final-quests/preview`로 최종 선정 경계의 동점을 확인한다.
5. 동점 선택이 필요하면 방장이 `POST /api/v1/rooms/{room_id}/final-quests/tie-break`에 필요한 수의 `selected_candidate_ids`를 전달한다.
6. 방장이 `POST /api/v1/rooms/{room_id}/final-quests`를 호출하면 최종 3개와 선정 사유를 저장하고 방 상태를 `QUEST_CONFIRMED`로 변경한다.

모든 요청은 `X-Device-Key`를 사용한다. 마감과 선택·확정은 방장 권한을 확인하고, 현황·최종 미리보기 조회는 현재 참여자에게 허용한다. 미투표자가 있어도 마감할 수 있으며, 마감 이후 투표 제출·수정과 재마감은 거부한다. 최종 확정 재요청은 기존 결과를 반환한다.

기피 음식 사전과 나열·기피 표현의 추가 확장은 후속 작업으로 남겨 둔다.
