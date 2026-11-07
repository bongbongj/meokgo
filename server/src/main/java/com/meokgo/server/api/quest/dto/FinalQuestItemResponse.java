package com.meokgo.server.api.quest.dto;

public record FinalQuestItemResponse(
        Long finalQuestId, int rankNo, String questTitle, long voteCount, String selectionReason
) {
}
