package com.meokgo.server.api.quest;

import com.meokgo.server.api.quest.dto.ConfirmFinalQuestsResponse;
import com.meokgo.server.api.quest.dto.FinalQuestPreviewResponse;
import com.meokgo.server.api.quest.dto.TieBreakRequest;
import com.meokgo.server.api.quest.dto.TieBreakResponse;
import com.meokgo.server.domain.quest.service.FinalQuestService;
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
@RequestMapping("/api/v1/rooms/{roomId}/final-quests")
public class FinalQuestController {

    private final FinalQuestService finalQuestService;

    public FinalQuestController(FinalQuestService finalQuestService) {
        this.finalQuestService = finalQuestService;
    }

    @GetMapping("/preview")
    public ApiResponse<FinalQuestPreviewResponse> preview(@DeviceKey String deviceKey, @PathVariable Long roomId) {
        return ApiResponse.success(finalQuestService.preview(deviceKey, roomId));
    }

    @PostMapping("/tie-break")
    public ApiResponse<TieBreakResponse> tieBreak(@DeviceKey String deviceKey, @PathVariable Long roomId,
            @Valid @RequestBody TieBreakRequest request) {
        return ApiResponse.success(finalQuestService.selectTieBreak(deviceKey, roomId, request.selectedCandidateIds()));
    }

    @PostMapping
    public ApiResponse<ConfirmFinalQuestsResponse> confirm(@DeviceKey String deviceKey, @PathVariable Long roomId) {
        return ApiResponse.success(finalQuestService.confirm(deviceKey, roomId));
    }
}
