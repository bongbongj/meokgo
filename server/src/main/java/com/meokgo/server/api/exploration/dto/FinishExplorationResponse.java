package com.meokgo.server.api.exploration.dto;

public record FinishExplorationResponse(Long roomId, String roomStatus, Long recordId, boolean storyOptional) {
}
