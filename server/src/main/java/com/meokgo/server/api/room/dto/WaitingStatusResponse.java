package com.meokgo.server.api.room.dto;

import java.time.LocalDateTime;
import java.util.List;

public record WaitingStatusResponse(
        Long roomId,
        String roomStatus,
        List<RoomParticipantSummary> participants,
        boolean isHost,
        boolean hostDisconnected,
        boolean hostActionExpired,
        LocalDateTime hostTakeoverAvailableAt,
        long hostTakeoverRemainingSeconds,
        boolean canTakeOverHost,
        boolean canStartVote
) {
}
