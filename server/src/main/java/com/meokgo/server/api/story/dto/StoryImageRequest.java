package com.meokgo.server.api.story.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.util.List;

public record StoryImageRequest(@NotNull @Positive Long templateId,
        @NotEmpty @Size(max = 4) List<@NotNull @Positive Long> photoIds,
        @Pattern(regexp = "9:16", message = "이미지 비율은 9:16만 지원합니다.") String imageRatio,
        @Size(max = 500) String memo) {
}
