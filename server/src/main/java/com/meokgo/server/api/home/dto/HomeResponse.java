package com.meokgo.server.api.home.dto;

import com.meokgo.server.api.record.dto.RecordListItemResponse;
import com.meokgo.server.domain.retention.service.RetentionService.Summary;
import java.util.List;

public record HomeResponse(ActiveRoom activeRoom, List<RecordListItemResponse> recentRecords,
        List<PopularRegion> popularRegions, Summary retention) {
    public record ActiveRoom(Long roomId, String roomStatus, String regionName, long participantCount,
            long completedQuestCount, long totalQuestCount) {
    }
    public record PopularRegion(Long regionId, String regionName, long explorationCount) {
    }
}
