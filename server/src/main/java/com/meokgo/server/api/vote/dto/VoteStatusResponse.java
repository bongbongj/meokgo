package com.meokgo.server.api.vote.dto;

import java.util.List;

public record VoteStatusResponse(
        int totalParticipantCount, int votedParticipantCount, int selectedCount, int maxSelectCount,
        String voteStatusText, boolean pushNotificationEnabled,
        List<VoteParticipantResponse> participants, List<CandidateVoteResult> candidateResults
) {
}
