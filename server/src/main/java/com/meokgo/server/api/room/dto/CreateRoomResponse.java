package com.meokgo.server.api.room.dto;

public record CreateRoomResponse(
        Long roomId,
        String roomCode,
        String roomStatus,
        int maxParticipantCount,
        String inviteUrl,
        RoomParticipantSummary participant
) {
}
