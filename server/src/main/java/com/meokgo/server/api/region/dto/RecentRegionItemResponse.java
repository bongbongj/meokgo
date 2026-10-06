package com.meokgo.server.api.region.dto;

import java.time.LocalDateTime;

public record RecentRegionItemResponse(
        Long regionId,
        String regionName,
        LocalDateTime selectedAt
) {
}
