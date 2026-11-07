package com.meokgo.server.global.error;

import java.util.List;

public class BusinessException extends RuntimeException {

    private final ErrorCode errorCode;
    private List<FieldErrorResponse> errors = List.of();

    public BusinessException(ErrorCode errorCode) {
        super(errorCode.getMessage());
        this.errorCode = errorCode;
    }

    public BusinessException(ErrorCode errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
    }

    public BusinessException(ErrorCode errorCode, List<FieldErrorResponse> errors) {
        this(errorCode);
        this.errors = List.copyOf(errors);
    }

    public List<FieldErrorResponse> getErrors() {
        return errors;
    }

    public ErrorCode getErrorCode() {
        return errorCode;
    }
}
