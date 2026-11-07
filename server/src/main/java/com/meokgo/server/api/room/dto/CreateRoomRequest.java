package com.meokgo.server.api.room.dto;

import com.meokgo.server.domain.room.domain.DrinkingOption;
import com.meokgo.server.domain.room.domain.ScheduleType;
import com.meokgo.server.domain.room.domain.TimeSlot;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateRoomRequest(
        @NotNull(message = "지역은 필수입니다.")
        Long regionId,

        @NotNull(message = "일정 유형은 필수입니다.")
        ScheduleType scheduleType,

        TimeSlot timeSlot,

        @NotNull(message = "음주 여부는 필수입니다.")
        DrinkingOption drinkingOption,

        @Size(max = 500, message = "기피 음식은 500자 이내로 입력해 주세요.")
        String avoidFoods
) {
}
