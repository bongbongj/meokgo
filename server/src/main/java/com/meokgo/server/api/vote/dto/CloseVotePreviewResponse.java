package com.meokgo.server.api.vote.dto;

import java.util.List;

public record CloseVotePreviewResponse(
        int notVotedParticipantCount, boolean confirmationRequired, boolean reopenSupported,
        List<CandidateVoteResult> topCandidates
) {
}
