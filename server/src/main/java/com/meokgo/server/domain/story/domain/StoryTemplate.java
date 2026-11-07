package com.meokgo.server.domain.story.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.Getter;

@Getter
@Entity
@Table(name = "story_template")
public class StoryTemplate {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "template_id")
    private Long id;
    @Column(name = "template_name", nullable = false, length = 50)
    private String name;
    @Column(name = "preview_url", nullable = false, length = 500)
    private String previewUrl = "";
    @Column(name = "active_yn", nullable = false)
    private boolean active = true;
    @Column(name = "display_order", nullable = false)
    private int displayOrder;
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    protected StoryTemplate() {
    }

    public StoryTemplate(String name, int displayOrder) {
        this.name = name;
        this.displayOrder = displayOrder;
    }

    public void assignPreviewUrl() {
        this.previewUrl = "/api/v1/story-templates/" + id + "/preview";
    }
}
