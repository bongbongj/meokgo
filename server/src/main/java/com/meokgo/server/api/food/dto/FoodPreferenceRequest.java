package com.meokgo.server.api.food.dto;

import jakarta.validation.constraints.Size;

public record FoodPreferenceRequest(
        @Size(max = 500, message = "기피 음식은 500자 이내로 입력해 주세요.") String avoidFoods
) {
}
