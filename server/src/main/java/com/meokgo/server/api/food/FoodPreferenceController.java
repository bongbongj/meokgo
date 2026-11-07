package com.meokgo.server.api.food;

import com.meokgo.server.api.food.dto.FoodPreferenceRequest;
import com.meokgo.server.api.food.dto.FoodPreferenceResponse;
import com.meokgo.server.domain.food.service.FoodPreferenceService;
import com.meokgo.server.global.response.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class FoodPreferenceController {

    private final FoodPreferenceService foodPreferenceService;

    public FoodPreferenceController(FoodPreferenceService foodPreferenceService) {
        this.foodPreferenceService = foodPreferenceService;
    }

    @PostMapping("/api/v1/food-preferences/preview")
    public ApiResponse<FoodPreferenceResponse> preview(@Valid @RequestBody FoodPreferenceRequest request) {
        return ApiResponse.success(foodPreferenceService.preview(request.avoidFoods()));
    }
}
