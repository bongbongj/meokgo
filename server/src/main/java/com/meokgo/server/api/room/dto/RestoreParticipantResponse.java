package com.meokgo.server.api.room.dto;

import java.util.List;

public record RestoreParticipantResponse(Long roomId, Long participantId, String nickname, String roomStatus,
        String participantStatus, boolean restoredByDevice, boolean voted, List<Long> votedCandidateIds) {
}
