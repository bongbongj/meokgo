package com.meokgo.server.api.region.dto;

import java.util.List;

public record RecentRegionListResponse(
        List<RecentRegionItemResponse> recentRegions
) {
}
