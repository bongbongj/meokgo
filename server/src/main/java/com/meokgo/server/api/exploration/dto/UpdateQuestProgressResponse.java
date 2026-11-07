package com.meokgo.server.api.exploration.dto;

import java.time.LocalDateTime;

public record UpdateQuestProgressResponse(Long finalQuestId, boolean completed, LocalDateTime completedAt,
        boolean requiresPhotoAuth, boolean requiresGpsAuth, boolean requiresReceiptAuth) {
}
