package com.meokgo.server.api.record;

import com.meokgo.server.api.record.dto.RecordDetailResponse;
import com.meokgo.server.api.record.dto.RecordListResponse;
import com.meokgo.server.domain.record.service.RecordService;
import com.meokgo.server.global.response.ApiResponse;
import com.meokgo.server.global.web.DeviceKey;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class RecordController {

    private final RecordService recordService;

    public RecordController(RecordService recordService) {
        this.recordService = recordService;
    }

    @GetMapping("/api/v1/users/me/records")
    public ApiResponse<RecordListResponse> list(@DeviceKey String deviceKey,
            @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.success(recordService.list(deviceKey, page, size));
    }

    @GetMapping("/api/v1/records/{recordId}")
    public ApiResponse<RecordDetailResponse> detail(@DeviceKey String deviceKey, @PathVariable Long recordId) {
        return ApiResponse.success(recordService.detail(deviceKey, recordId));
    }
}
