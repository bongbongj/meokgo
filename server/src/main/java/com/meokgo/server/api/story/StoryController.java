package com.meokgo.server.api.story;

import com.meokgo.server.api.story.dto.PhotoUploadResponse;
import com.meokgo.server.api.story.dto.StoryImageRequest;
import com.meokgo.server.api.story.dto.StoryImageResponse;
import com.meokgo.server.api.story.dto.StoryTemplateListResponse;
import com.meokgo.server.domain.story.service.StoryService;
import com.meokgo.server.global.response.ApiResponse;
import com.meokgo.server.global.web.DeviceKey;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
public class StoryController {
    private final StoryService storyService;

    public StoryController(StoryService storyService) {
        this.storyService = storyService;
    }

    @GetMapping("/api/v1/story-templates")
    public ApiResponse<StoryTemplateListResponse> templates(@DeviceKey String deviceKey) {
        return ApiResponse.success(storyService.templates(deviceKey));
    }

    @GetMapping("/api/v1/story-templates/{templateId}/preview")
    public ResponseEntity<byte[]> preview(@DeviceKey String deviceKey, @PathVariable Long templateId) {
        return png(storyService.preview(deviceKey, templateId));
    }

    @PostMapping(value = "/api/v1/records/{recordId}/photos", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<PhotoUploadResponse> upload(@DeviceKey String deviceKey, @PathVariable Long recordId,
            @RequestParam("photos") List<MultipartFile> photos) {
        return ApiResponse.success(storyService.upload(deviceKey, recordId, photos));
    }

    @GetMapping("/api/v1/records/{recordId}/photos/{photoId}/content")
    public ResponseEntity<byte[]> photo(@DeviceKey String deviceKey, @PathVariable Long recordId, @PathVariable Long photoId) {
        return png(storyService.photoContent(deviceKey, recordId, photoId));
    }

    @PostMapping("/api/v1/records/{recordId}/story-image")
    public ApiResponse<StoryImageResponse> generate(@DeviceKey String deviceKey, @PathVariable Long recordId,
            @Valid @RequestBody StoryImageRequest request) {
        return ApiResponse.success(storyService.generate(deviceKey, recordId, request));
    }

    @GetMapping("/api/v1/records/{recordId}/story-image/{imageId}")
    public ApiResponse<StoryImageResponse> image(@DeviceKey String deviceKey, @PathVariable Long recordId,
            @PathVariable Long imageId) {
        return ApiResponse.success(storyService.image(deviceKey, recordId, imageId));
    }

    @GetMapping("/api/v1/records/{recordId}/story-image/{imageId}/content")
    public ResponseEntity<byte[]> content(@DeviceKey String deviceKey, @PathVariable Long recordId,
            @PathVariable Long imageId) {
        return png(storyService.imageContent(deviceKey, recordId, imageId));
    }

    private ResponseEntity<byte[]> png(byte[] bytes) {
        return ResponseEntity.ok().contentType(MediaType.IMAGE_PNG).cacheControl(CacheControl.noStore())
                .header(HttpHeaders.VARY, "X-Device-Key")
                .header("X-Content-Type-Options", "nosniff").body(bytes);
    }
}
