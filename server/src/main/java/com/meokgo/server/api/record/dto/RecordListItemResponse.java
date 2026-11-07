package com.meokgo.server.api.record.dto;

import java.time.LocalDateTime;

public record RecordListItemResponse(Long recordId, String regionName, int participantCount,
        int completedQuestCount, LocalDateTime createdAt) {
}
