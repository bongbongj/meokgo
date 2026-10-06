package com.meokgo.server.api.vote.dto;

import java.util.List;

public record VoteResponse(
        Long roomId,
        boolean voted,
        List<Long> candidateIds
) {
}
