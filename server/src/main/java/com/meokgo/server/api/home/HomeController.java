package com.meokgo.server.api.home;

import com.meokgo.server.api.home.dto.HomeResponse;
import com.meokgo.server.domain.home.service.HomeService;
import com.meokgo.server.global.response.ApiResponse;
import com.meokgo.server.global.web.DeviceKey;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HomeController {
    private final HomeService homeService;

    public HomeController(HomeService homeService) {
        this.homeService = homeService;
    }

    @GetMapping("/api/v1/home")
    public ApiResponse<HomeResponse> home(@DeviceKey String deviceKey) {
        return ApiResponse.success(homeService.home(deviceKey));
    }
}
