package com.meokgo.server.api.room.dto;

import java.util.List;

public record RoomDetailResponse(Long roomId, String roomStatus, String regionName, RoomConditionResponse condition,
        List<RoomDetailParticipantResponse> participants) {
}
