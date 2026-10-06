package com.meokgo.server.api.room.dto;

public record RoomParticipantSummary(
        Long participantId,
        String nickname,
        String role,
        boolean connected
) {
}
