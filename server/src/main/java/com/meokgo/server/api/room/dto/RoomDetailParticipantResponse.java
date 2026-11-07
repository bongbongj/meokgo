package com.meokgo.server.api.room.dto;

public record RoomDetailParticipantResponse(Long participantId, String nickname, String role, String status,
        boolean connected) {
}
