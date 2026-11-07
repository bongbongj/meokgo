package com.meokgo.server.api.exploration.dto;

import jakarta.validation.constraints.NotNull;

public record UpdateQuestProgressRequest(@NotNull(message = "완료 여부는 필수입니다.") Boolean completed) {
}
