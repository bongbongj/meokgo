package com.meokgo.server.api.food.dto;

import java.util.List;

public record FoodPreferenceResponse(
        String avoidFoods,
        List<String> recognizedAvoidKeywords,
        List<String> unresolvedExpressions,
        boolean needsReview,
        String dictionaryVersion
) {
}
