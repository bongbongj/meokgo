package com.meokgo.server.api.vote.dto;

public record VoteParticipantResponse(
        Long participantId, String nickname, boolean voted
) {
}
