package com.meokgo.server.api.quest.dto;

import java.util.List;

public record ConfirmFinalQuestsResponse(
        Long roomId, String roomStatus, List<FinalQuestItemResponse> finalQuests
) {
}
