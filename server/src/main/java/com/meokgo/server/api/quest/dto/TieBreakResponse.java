package com.meokgo.server.api.quest.dto;

import java.util.List;

public record TieBreakResponse(
        Long roomId, boolean tieBreakResolved, List<Long> selectedCandidateIds
) {
}
