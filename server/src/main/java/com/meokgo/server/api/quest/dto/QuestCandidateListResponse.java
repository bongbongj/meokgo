package com.meokgo.server.api.quest.dto;

import java.util.List;

public record QuestCandidateListResponse(
        int candidateCount,
        boolean needConditionReset,
        int minSelectCount,
        int maxSelectCount,
        List<QuestCandidateItemResponse> candidates
) {
}
