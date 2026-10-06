package com.meokgo.server.api.region;

import com.meokgo.server.api.region.dto.RecentRegionListResponse;
import com.meokgo.server.api.region.dto.RegionListResponse;
import com.meokgo.server.domain.region.service.RegionService;
import com.meokgo.server.global.response.ApiResponse;
import com.meokgo.server.global.web.DeviceKey;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class RegionController {

    private final RegionService regionService;

    public RegionController(RegionService regionService) {
        this.regionService = regionService;
    }

    @GetMapping("/api/v1/regions")
    public ApiResponse<RegionListResponse> getRegions(
            @RequestParam(required = false) String keyword,
            @RequestParam(name = "parent_region_id", required = false) Long parentRegionId
    ) {
        return ApiResponse.success(regionService.getRegions(keyword, parentRegionId));
    }

    @GetMapping("/api/v1/users/me/recent-regions")
    public ApiResponse<RecentRegionListResponse> getRecentRegions(@DeviceKey String deviceKey) {
        return ApiResponse.success(regionService.getRecentRegions(deviceKey));
    }
}
