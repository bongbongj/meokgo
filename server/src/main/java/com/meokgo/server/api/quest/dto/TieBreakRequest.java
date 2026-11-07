package com.meokgo.server.api.quest.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public record TieBreakRequest(
        @NotEmpty(message = "동점 후보를 선택해 주세요.")
        List<@NotNull(message = "후보 ID는 필수입니다.") Long> selectedCandidateIds
) {
}
