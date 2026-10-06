package com.meokgo.server.api.quest.dto;

public record QuestCandidateItemResponse(
        Long candidateId,
        Long questId,
        String questTitle,
        String questDescription,
        String questType,
        String selectedReason,
        int candidateOrder,
        boolean selected,
        long voteCount
) {
}
