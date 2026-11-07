package com.meokgo.server.api.exploration.dto;

public record ExplorationQuestResponse(Long finalQuestId, String questTitle, boolean completed,
        long completedParticipantCount) {
}
