package com.meokgo.server.global.error;

import java.time.LocalDateTime;
import java.util.List;

public record ErrorResponse(
        LocalDateTime timestamp,
        int status,
        String code,
        String message,
        List<FieldErrorResponse> errors,
        String path
) {

    public static ErrorResponse of(ErrorCode errorCode, String message, String path) {
        return new ErrorResponse(
                LocalDateTime.now(),
                errorCode.getStatus().value(),
                errorCode.getCode(),
                message,
                List.of(),
                path
        );
    }

    public static ErrorResponse of(ErrorCode errorCode, List<FieldErrorResponse> errors, String path) {
        return new ErrorResponse(
                LocalDateTime.now(),
                errorCode.getStatus().value(),
                errorCode.getCode(),
                errorCode.getMessage(),
                errors,
                path
        );
    }
}
