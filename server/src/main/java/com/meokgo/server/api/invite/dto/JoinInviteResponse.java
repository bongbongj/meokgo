package com.meokgo.server.api.invite.dto;

public record JoinInviteResponse(
        Long roomId,
        Long participantId,
        String roomStatus,
        boolean restoredByDevice
) {
}
