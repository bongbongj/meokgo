package com.meokgo.server.api.quest;

import com.meokgo.server.api.quest.dto.CreateQuestCandidatesResponse;
import com.meokgo.server.api.quest.dto.QuestCandidateListResponse;
import com.meokgo.server.domain.quest.service.QuestCandidateService;
import com.meokgo.server.global.response.ApiResponse;
import com.meokgo.server.global.web.DeviceKey;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/rooms/{roomId}/quest-candidates")
public class QuestCandidateController {

    private final QuestCandidateService questCandidateService;

    public QuestCandidateController(QuestCandidateService questCandidateService) {
        this.questCandidateService = questCandidateService;
    }

    @PostMapping
    public ApiResponse<CreateQuestCandidatesResponse> createCandidates(@PathVariable Long roomId) {
        return ApiResponse.success(questCandidateService.createCandidates(roomId));
    }

    @GetMapping
    public ApiResponse<QuestCandidateListResponse> getCandidates(
            @DeviceKey String deviceKey,
            @PathVariable Long roomId
    ) {
        return ApiResponse.success(questCandidateService.getCandidates(deviceKey, roomId));
    }
}
