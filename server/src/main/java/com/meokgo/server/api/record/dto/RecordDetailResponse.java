package com.meokgo.server.api.record.dto;

import java.time.LocalDateTime;
import java.util.List;

public record RecordDetailResponse(Long recordId, String regionName, LocalDateTime createdAt,
        List<String> participants, List<RecordQuestResponse> completedQuests, List<RecordPhotoResponse> photos) {
}
