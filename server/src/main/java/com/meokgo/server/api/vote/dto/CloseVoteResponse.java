package com.meokgo.server.api.vote.dto;

public record CloseVoteResponse(
        Long roomId, String roomStatus, int notVotedParticipantCount, boolean reopenSupported
) {
}
