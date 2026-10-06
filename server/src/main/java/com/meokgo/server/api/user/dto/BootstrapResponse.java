package com.meokgo.server.api.user.dto;

public record BootstrapResponse(
        Long userId,
        String nickname,
        boolean firstLaunch,
        boolean hasActiveRoom,
        Long activeRoomId,
        Long activeParticipantId,
        boolean restoredByDevice,
        boolean voteRestored
) {
}
