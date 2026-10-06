package com.meokgo.server.api.invite.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record JoinInviteRequest(
        @NotBlank(message = "닉네임은 필수 입력값입니다.")
        @Size(min = 1, max = 10, message = "닉네임은 1자 이상 10자 이하로 입력해야 합니다.")
        String nickname
) {
}
