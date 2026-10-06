package com.meokgo.server.api.region.dto;

public record RegionItemResponse(
        Long regionId,
        String regionName,
        Long parentRegionId
) {
}
