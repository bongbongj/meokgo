package com.meokgo.server.api.quest.dto;

public record FinalQuestCandidateResponse(
        Long candidateId, String questTitle, long voteCount, int rankNo
) {
}
