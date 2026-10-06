package com.meokgo.server.api.invite.dto;

import java.time.LocalDateTime;

public record InviteInfoResponse(
        String inviteToken,
        Long roomId,
        String hostNickname,
        String regionName,
        LocalDateTime createdAt,
        LocalDateTime expiredAt,
        boolean joinable,
        String unjoinableReason
) {
}
