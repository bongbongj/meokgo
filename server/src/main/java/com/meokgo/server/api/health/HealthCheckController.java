package com.meokgo.server.api.health;

import com.meokgo.server.global.response.ApiResponse;
import com.meokgo.server.global.web.DeviceKey;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/health")
public class HealthCheckController {

    @GetMapping
    public ApiResponse<HealthCheckResponse> health(@DeviceKey String deviceKey) {
        return ApiResponse.success(new HealthCheckResponse("UP", deviceKey));
    }
}
