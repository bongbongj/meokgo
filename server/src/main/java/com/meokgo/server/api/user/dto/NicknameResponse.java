package com.meokgo.server.api.user.dto;

public record NicknameResponse(
        Long userId,
        String nickname,
        Boolean firstLaunch
) {
}
