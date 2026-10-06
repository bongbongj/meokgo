package com.meokgo.server.api.vote.dto;

import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public record VoteRequest(
        @NotEmpty(message = "투표할 후보를 1개 이상 선택해야 합니다.")
        List<Long> candidateIds
) {
}
