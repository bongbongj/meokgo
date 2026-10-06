package com.meokgo.server.global.error;

public record FieldErrorResponse(
        String field,
        Object value,
        String reason
) {
}
