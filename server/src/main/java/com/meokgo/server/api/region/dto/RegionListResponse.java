package com.meokgo.server.api.region.dto;

import java.util.List;

public record RegionListResponse(
        List<RegionItemResponse> regions
) {
}
