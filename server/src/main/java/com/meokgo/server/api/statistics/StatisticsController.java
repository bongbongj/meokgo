package com.meokgo.server.api.statistics;

import com.meokgo.server.api.statistics.dto.StatisticsResponse;
import com.meokgo.server.domain.user.service.StatisticsService;
import com.meokgo.server.global.response.ApiResponse;
import com.meokgo.server.global.web.DeviceKey;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class StatisticsController {
    private final StatisticsService statisticsService;

    public StatisticsController(StatisticsService statisticsService) {
        this.statisticsService = statisticsService;
    }

    @GetMapping("/api/v1/users/me/statistics")
    public ApiResponse<StatisticsResponse> statistics(@DeviceKey String deviceKey) {
        return ApiResponse.success(statisticsService.statistics(deviceKey));
    }
}
