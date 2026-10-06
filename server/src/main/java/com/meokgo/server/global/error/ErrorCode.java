package com.meokgo.server.global.error;

import org.springframework.http.HttpStatus;

public enum ErrorCode {

    COMMON_INVALID_REQUEST("COMMON-001", HttpStatus.BAD_REQUEST, "입력값이 올바르지 않습니다."),
    COMMON_UNSUPPORTED_VALUE("COMMON-002", HttpStatus.BAD_REQUEST, "지원하지 않는 요청 값입니다."),

    USER_NOT_FOUND("USER-001", HttpStatus.NOT_FOUND, "사용자를 찾을 수 없습니다."),
    USER_INVALID_NICKNAME("USER-002", HttpStatus.BAD_REQUEST, "닉네임 형식이 올바르지 않습니다."),

    REGION_NOT_FOUND("REGION-001", HttpStatus.NOT_FOUND, "지역을 찾을 수 없습니다."),

    ROOM_NOT_FOUND("ROOM-001", HttpStatus.NOT_FOUND, "탐험방을 찾을 수 없습니다."),
    ROOM_ALREADY_STARTED("ROOM-002", HttpStatus.CONFLICT, "이미 투표 또는 탐험이 시작된 방입니다."),
    ROOM_CLOSED("ROOM-003", HttpStatus.CONFLICT, "참여할 수 없는 방입니다."),
    ROOM_FORBIDDEN("ROOM-004", HttpStatus.FORBIDDEN, "방장 권한이 없습니다."),
    ROOM_HOST_TAKEOVER_NOT_AVAILABLE("ROOM-005", HttpStatus.CONFLICT, "방장 권한 이어받기 가능 시간이 아닙니다."),

    INVITE_INVALID("INVITE-001", HttpStatus.BAD_REQUEST, "잘못된 초대 링크입니다."),
    INVITE_EXPIRED("INVITE-002", HttpStatus.GONE, "만료된 초대 링크입니다."),

    PARTICIPANT_NOT_FOUND("PARTICIPANT-001", HttpStatus.NOT_FOUND, "참여자를 찾을 수 없습니다."),
    PARTICIPANT_LIMIT_EXCEEDED("PARTICIPANT-002", HttpStatus.CONFLICT, "정원을 초과했습니다."),
    PARTICIPANT_NICKNAME_DUPLICATED("PARTICIPANT-003", HttpStatus.CONFLICT, "같은 탐험방 내에서 이미 사용 중인 닉네임입니다."),

    QUEST_NOT_FOUND("QUEST-001", HttpStatus.NOT_FOUND, "퀘스트를 찾을 수 없습니다."),
    QUEST_CANDIDATE_NOT_READY("QUEST-002", HttpStatus.CONFLICT, "후보 퀘스트가 아직 생성되지 않았습니다."),
    QUEST_CANDIDATE_INSUFFICIENT("QUEST-003", HttpStatus.BAD_REQUEST, "조건에 맞는 퀘스트가 부족합니다. 탐험 조건을 다시 설정해 주세요."),

    VOTE_ALREADY_CLOSED("VOTE-001", HttpStatus.CONFLICT, "이미 마감된 투표입니다."),
    VOTE_SELECTION_INVALID("VOTE-002", HttpStatus.BAD_REQUEST, "투표 선택 개수가 올바르지 않습니다."),
    VOTE_CLOSE_CONFIRM_REQUIRED("VOTE-003", HttpStatus.BAD_REQUEST, "투표 마감 확인이 필요합니다."),
    VOTE_REOPEN_NOT_SUPPORTED("VOTE-004", HttpStatus.CONFLICT, "MVP에서는 투표 재오픈을 지원하지 않습니다."),

    FINAL_TIE_BREAK_REQUIRED("FINAL-001", HttpStatus.CONFLICT, "동점 후보 방장 선택이 필요합니다."),

    RECORD_NOT_FOUND("RECORD-001", HttpStatus.NOT_FOUND, "탐험 기록을 찾을 수 없습니다."),
    STORY_NOT_SELECTED("STORY-001", HttpStatus.BAD_REQUEST, "Story 제작을 선택하지 않았습니다."),
    FILE_INVALID("FILE-001", HttpStatus.BAD_REQUEST, "업로드 파일 형식 또는 개수가 올바르지 않습니다.");

    private final String code;
    private final HttpStatus status;
    private final String message;

    ErrorCode(String code, HttpStatus status, String message) {
        this.code = code;
        this.status = status;
        this.message = message;
    }

    public String getCode() {
        return code;
    }

    public HttpStatus getStatus() {
        return status;
    }

    public String getMessage() {
        return message;
    }
}
