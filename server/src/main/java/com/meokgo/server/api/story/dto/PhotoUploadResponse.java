package com.meokgo.server.api.story.dto;

import com.meokgo.server.api.record.dto.RecordPhotoResponse;
import java.util.List;

public record PhotoUploadResponse(Long recordId, List<RecordPhotoResponse> photos) {
}
