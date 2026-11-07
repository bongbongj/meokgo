package com.meokgo.server.api.room.dto;

public record RoomConditionResponse(String scheduleType, String timeSlot, String drinkingOption, String avoidFoods) {
}
