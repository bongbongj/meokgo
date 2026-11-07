package com.meokgo.server.domain.story.domain;

import com.meokgo.server.domain.record.domain.ExplorationRecord;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;

@Getter
@Entity
@Table(name = "story_image", indexes = @Index(name = "idx_story_expiration", columnList = "deleted_yn,expired_at"))
public class StoryImage extends StoredImage {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "story_image_id")
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "template_id", nullable = false)
    private StoryTemplate template;
    @Column(name = "story_image_url", nullable = false, length = 500)
    private String storyImageUrl = "";
    @Column(name = "image_ratio", nullable = false, length = 10)
    private String imageRatio = "9:16";

    protected StoryImage() {
    }

    public StoryImage(ExplorationRecord record, StoryTemplate template, String path) {
        super(record, path);
        this.template = template;
    }

    public void assignUrl() {
        this.storyImageUrl = "/api/v1/records/" + record.getId() + "/story-image/" + id + "/content";
    }
}
