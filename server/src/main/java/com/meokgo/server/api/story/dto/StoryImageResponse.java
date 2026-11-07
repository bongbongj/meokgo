package com.meokgo.server.api.story.dto;

import com.meokgo.server.domain.story.domain.StoryImage;
import java.time.LocalDateTime;

public record StoryImageResponse(Long storyImageId, String storyImageUrl, String imageRatio,
        String storageProvider, LocalDateTime expiredAt, LocalDateTime createdAt) {
    public static StoryImageResponse from(StoryImage image) {
        return new StoryImageResponse(image.getId(), image.getStoryImageUrl(), image.getImageRatio(),
                image.getStorageProvider(), image.getExpiredAt(), image.getCreatedAt());
    }
}
