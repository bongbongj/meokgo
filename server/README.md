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
| `DB_PASSWORD` | 빈 값 | DB 비밀번호 |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:3000,http://localhost:5173,http://localhost:8081` | 허용할 프론트 개발 서버 Origin |

루트의 `docker-compose.yml`로 MySQL을 실행하면 기본 비밀번호는 `meokgo`다.

## 실행

```bash
./gradlew bootRun
```

## 테스트

```bash
./gradlew test
```

## 헬스체크

```bash
curl -H "X-Device-Key: local-device" http://localhost:8080/api/v1/health
```

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
