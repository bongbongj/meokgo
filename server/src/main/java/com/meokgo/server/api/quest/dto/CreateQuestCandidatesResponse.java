package com.meokgo.server.api.quest.dto;

import java.util.List;

public record CreateQuestCandidatesResponse(
        Long roomId,
        int candidateCount,
        boolean filledWithHistoryQuest,
        boolean needConditionReset,
        List<QuestCandidateItemResponse> candidates
) {
}
