# 먹으러GO

친구와 퀘스트를 고르고 직접 새로운 맛과 장소를 발견하는 현실 기반 푸드 어드벤처 서비스다.

## 프로젝트 구조

```text
먹으러go
├── reference
│   ├── API명세서.md
│   └── DB설계서.md
├── server
│   └── Spring Boot API 서버
└── docker-compose.yml
```

## 기술 방향

| 영역 | 기술 |
| --- | --- |
| 호스트 앱 | React Native |
| 참여자 페이지 | React 웹 |
| 백엔드 | Spring Boot |
| DB | MySQL 8.0 |
| 사용자 식별 | MVP 기준 `X-Device-Key` |

## 현재 세팅 완료 범위

- Spring Boot 서버 기본 프로젝트
- 공통 성공 응답
- 공통 오류 응답
- API 명세서 기준 오류 코드
- 전역 예외 처리
- `X-Device-Key` 인자 처리
- `device_user` 엔티티와 사용자 API
- `region`, `user_recent_region` 엔티티와 지역 조회 API
- React Native, React 웹 개발 서버용 CORS 기본값
- 로컬 MySQL용 Docker Compose

## 로컬 DB 실행

```bash
docker compose up -d
```

## 서버 테스트

```bash
cd server
./gradlew test
```

## 서버 실행

```bash
cd server
./gradlew bootRun
```

## 헬스체크

```bash
curl -H "X-Device-Key: local-device" http://localhost:8080/api/v1/health
```

## 다음 구현 순서

1. 탐험방 생성, 초대 링크, 참여자 API 구현
2. 퀘스트 후보 생성 로직 구현
3. 투표, 마감, 동점 선택 로직 구현
4. 탐험 진행과 기록 API 구현
