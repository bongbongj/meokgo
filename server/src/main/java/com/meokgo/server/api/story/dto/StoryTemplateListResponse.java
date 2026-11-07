package com.meokgo.server.api.story.dto;

import java.util.List;

public record StoryTemplateListResponse(List<TemplateResponse> templates) {
    public record TemplateResponse(Long templateId, String templateName, String previewUrl) {
    }
}
