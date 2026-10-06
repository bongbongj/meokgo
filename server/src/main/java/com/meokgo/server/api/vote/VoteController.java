package com.meokgo.server.api.vote;

import com.meokgo.server.api.vote.dto.VoteRequest;
import com.meokgo.server.api.vote.dto.VoteResponse;
import com.meokgo.server.domain.vote.service.VoteService;
import com.meokgo.server.global.response.ApiResponse;
import com.meokgo.server.global.web.DeviceKey;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/rooms/{roomId}/votes/me")
public class VoteController {

    private final VoteService voteService;

    public VoteController(VoteService voteService) {
        this.voteService = voteService;
    }

    @PostMapping
    public ApiResponse<VoteResponse> saveVote(
            @DeviceKey String deviceKey,
            @PathVariable Long roomId,
            @Valid @RequestBody VoteRequest request
    ) {
        return ApiResponse.success(voteService.saveVote(deviceKey, roomId, request.candidateIds()));
    }

    @PutMapping
    public ApiResponse<VoteResponse> updateVote(
            @DeviceKey String deviceKey,
            @PathVariable Long roomId,
            @Valid @RequestBody VoteRequest request
    ) {
        return ApiResponse.success(voteService.saveVote(deviceKey, roomId, request.candidateIds()));
    }
}
