package com.meokgo.server.api.quest.dto;

import java.util.List;

public record FinalQuestPreviewResponse(
        boolean tieBreakRequired, boolean autoConfirmable,
        List<FinalQuestCandidateResponse> finalQuestCandidates, List<TieGroupResponse> tieGroups
) {
}
