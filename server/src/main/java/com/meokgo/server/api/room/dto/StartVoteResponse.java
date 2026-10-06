package com.meokgo.server.api.room.dto;

public record StartVoteResponse(
        Long roomId,
        String roomStatus,
        Long voteId
) {
}
