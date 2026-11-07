package com.meokgo.server.api.exploration;

import com.meokgo.server.api.exploration.dto.ExplorationProgressResponse;
import com.meokgo.server.api.exploration.dto.FinishExplorationResponse;
import com.meokgo.server.api.exploration.dto.StartExplorationResponse;
import com.meokgo.server.api.exploration.dto.UpdateQuestProgressRequest;
import com.meokgo.server.api.exploration.dto.UpdateQuestProgressResponse;
import com.meokgo.server.domain.exploration.service.ExplorationService;
import com.meokgo.server.global.response.ApiResponse;
import com.meokgo.server.global.web.DeviceKey;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/rooms/{roomId}")
public class ExplorationController {

    private final ExplorationService explorationService;

    public ExplorationController(ExplorationService explorationService) {
        this.explorationService = explorationService;
    }

    @PostMapping("/exploration/start")
    public ApiResponse<StartExplorationResponse> start(@DeviceKey String deviceKey, @PathVariable Long roomId) {
        return ApiResponse.success(explorationService.start(deviceKey, roomId));
    }

    @GetMapping("/exploration/progress")
    public ApiResponse<ExplorationProgressResponse> progress(@DeviceKey String deviceKey, @PathVariable Long roomId) {
        return ApiResponse.success(explorationService.progress(deviceKey, roomId));
    }

    @PatchMapping("/final-quests/{finalQuestId}/progress")
    public ApiResponse<UpdateQuestProgressResponse> update(@DeviceKey String deviceKey, @PathVariable Long roomId,
            @PathVariable Long finalQuestId, @Valid @RequestBody UpdateQuestProgressRequest request) {
        return ApiResponse.success(explorationService.update(deviceKey, roomId, finalQuestId, request.completed()));
    }

    @PostMapping("/exploration/finish")
    public ApiResponse<FinishExplorationResponse> finish(@DeviceKey String deviceKey, @PathVariable Long roomId) {
        return ApiResponse.success(explorationService.finish(deviceKey, roomId));
    }
}
