package com.meokgo.server.domain.region.service;

import com.meokgo.server.api.region.dto.RecentRegionItemResponse;
import com.meokgo.server.api.region.dto.RecentRegionListResponse;
import com.meokgo.server.api.region.dto.RegionItemResponse;
import com.meokgo.server.api.region.dto.RegionListResponse;
import com.meokgo.server.domain.region.domain.Region;
import com.meokgo.server.domain.region.domain.UserRecentRegion;
import com.meokgo.server.domain.region.repository.RegionRepository;
import com.meokgo.server.domain.region.repository.UserRecentRegionRepository;
import com.meokgo.server.domain.user.domain.DeviceUser;
import com.meokgo.server.domain.user.repository.DeviceUserRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@Transactional(readOnly = true)
public class RegionService {

    private final RegionRepository regionRepository;
    private final UserRecentRegionRepository userRecentRegionRepository;
    private final DeviceUserRepository deviceUserRepository;

    public RegionService(
            RegionRepository regionRepository,
            UserRecentRegionRepository userRecentRegionRepository,
            DeviceUserRepository deviceUserRepository
    ) {
        this.regionRepository = regionRepository;
        this.userRecentRegionRepository = userRecentRegionRepository;
        this.deviceUserRepository = deviceUserRepository;
    }

    public RegionListResponse getRegions(String keyword, Long parentRegionId) {
        List<Region> regions;
        if (StringUtils.hasText(keyword)) {
            regions = regionRepository.findByActiveTrueAndNameContainingIgnoreCaseOrderByDisplayOrderAscNameAsc(keyword.trim());
        } else if (parentRegionId != null) {
            regions = regionRepository.findByActiveTrueAndParentRegionIdOrderByDisplayOrderAscNameAsc(parentRegionId);
        } else {
            regions = regionRepository.findByActiveTrueOrderByDisplayOrderAscNameAsc();
        }

        return new RegionListResponse(regions.stream()
                .map(this::toRegionItemResponse)
                .toList());
    }

    public RecentRegionListResponse getRecentRegions(String deviceKey) {
        return deviceUserRepository.findByDeviceKey(deviceKey)
                .map(this::getRecentRegions)
                .orElseGet(() -> new RecentRegionListResponse(List.of()));
    }

    private RecentRegionListResponse getRecentRegions(DeviceUser user) {
        List<RecentRegionItemResponse> recentRegions = userRecentRegionRepository.findTop5ByUserOrderBySelectedAtDesc(user)
                .stream()
                .map(this::toRecentRegionItemResponse)
                .toList();

        return new RecentRegionListResponse(recentRegions);
    }

    private RegionItemResponse toRegionItemResponse(Region region) {
        return new RegionItemResponse(region.getId(), region.getName(), region.getParentRegionId());
    }

    private RecentRegionItemResponse toRecentRegionItemResponse(UserRecentRegion recentRegion) {
        Region region = recentRegion.getRegion();
        return new RecentRegionItemResponse(region.getId(), region.getName(), recentRegion.getSelectedAt());
    }
}
