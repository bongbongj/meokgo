package com.meokgo.server.api.invite;

import com.meokgo.server.api.invite.dto.InviteInfoResponse;
import com.meokgo.server.api.invite.dto.JoinInviteRequest;
import com.meokgo.server.api.invite.dto.JoinInviteResponse;
import com.meokgo.server.domain.room.service.InviteService;
import com.meokgo.server.global.response.ApiResponse;
import com.meokgo.server.global.web.DeviceKey;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/invites")
public class InviteController {

    private final InviteService inviteService;

    public InviteController(InviteService inviteService) {
        this.inviteService = inviteService;
    }

    @GetMapping("/{inviteToken}")
    public ApiResponse<InviteInfoResponse> getInviteInfo(@PathVariable String inviteToken) {
        return ApiResponse.success(inviteService.getInviteInfo(inviteToken));
    }

    @PostMapping("/{inviteToken}/join")
    public ApiResponse<JoinInviteResponse> join(
            @DeviceKey String deviceKey,
            @PathVariable String inviteToken,
            @Valid @RequestBody JoinInviteRequest request
    ) {
        return ApiResponse.success(inviteService.join(deviceKey, inviteToken, request.nickname()));
    }
}
