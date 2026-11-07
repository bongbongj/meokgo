package com.meokgo.server.api.exploration.dto;

import java.util.List;

public record ExplorationProgressResponse(Long roomId, String regionName, int participantCount,
        int totalQuestCount, long completedQuestCount, int progressRate, List<ExplorationQuestResponse> quests) {
}
