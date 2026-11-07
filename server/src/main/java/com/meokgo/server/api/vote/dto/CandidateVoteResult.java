package com.meokgo.server.api.vote.dto;

public record CandidateVoteResult(
        Long candidateId, String questTitle, long voteCount
) {
}
