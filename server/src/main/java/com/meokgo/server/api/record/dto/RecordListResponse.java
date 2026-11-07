package com.meokgo.server.api.record.dto;

import java.util.List;

public record RecordListResponse(List<RecordListItemResponse> records, boolean hasNext) {
}
