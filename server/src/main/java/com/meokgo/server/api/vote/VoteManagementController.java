package com.meokgo.server.api.vote;

import com.meokgo.server.api.vote.dto.CloseVotePreviewResponse;
import com.meokgo.server.api.vote.dto.CloseVoteRequest;
import com.meokgo.server.api.vote.dto.CloseVoteResponse;
import com.meokgo.server.api.vote.dto.VoteStatusResponse;
import com.meokgo.server.domain.vote.service.VoteService;
import com.meokgo.server.global.response.ApiResponse;
import com.meokgo.server.global.web.DeviceKey;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/rooms/{roomId}/votes")
public class VoteManagementController {

    private final VoteService voteService;

    public VoteManagementController(VoteService voteService) {
        this.voteService = voteService;
    }

    @GetMapping("/status")
    public ApiResponse<VoteStatusResponse> status(@DeviceKey String deviceKey, @PathVariable Long roomId) {
        return ApiResponse.success(voteService.getStatus(deviceKey, roomId));
    }

    @GetMapping("/close-preview")
    public ApiResponse<CloseVotePreviewResponse> previewClose(@DeviceKey String deviceKey, @PathVariable Long roomId) {
        return ApiResponse.success(voteService.previewClose(deviceKey, roomId));
    }

    @PostMapping("/close")
    public ApiResponse<CloseVoteResponse> close(@DeviceKey String deviceKey, @PathVariable Long roomId,
            @RequestBody CloseVoteRequest request) {
        return ApiResponse.success(voteService.close(deviceKey, roomId, request.confirmed()));
    }
}
