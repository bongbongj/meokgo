package com.meokgo.server.api.quest.dto;

import com.meokgo.server.api.vote.dto.CandidateVoteResult;
import java.util.List;

public record TieGroupResponse(
        int tieGroupNo, int requiredSelectCount, List<CandidateVoteResult> candidates
) {
}
