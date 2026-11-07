package com.meokgo.server.api.home.dto;

import com.meokgo.server.domain.retention.service.RetentionService.Summary;
import java.time.LocalDateTime;
import java.util.List;

public record HomeResponse(ActiveRoom activeRoom, List<RecentRecord> recentRecords,
        List<PopularRegion> popularRegions, Summary retention) {
    public record ActiveRoom(Long roomId, String roomStatus, String regionName, long participantCount,
            long completedQuestCount, long totalQuestCount) {
    }
    public record RecentRecord(Long recordId, String regionName, int participantCount,
            int completedQuestCount, LocalDateTime createdAt, String thumbnailUrl) {
    }
    public record PopularRegion(Long regionId, String regionName, long explorationCount, String regionImageUrl) {
    }
}
