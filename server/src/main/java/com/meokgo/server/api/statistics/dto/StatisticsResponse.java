package com.meokgo.server.api.statistics.dto;

import java.util.List;

public record StatisticsResponse(long completedExplorationCount, long completedQuestCount,
        long visitedRegionCount, List<StageResponse> retentionStages) {
    public record StageResponse(String stageCode, String stageName, boolean achieved, String rewardDescription) {
    }
}
