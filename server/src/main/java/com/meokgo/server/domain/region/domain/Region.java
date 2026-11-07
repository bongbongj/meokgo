package com.meokgo.server.domain.region.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.net.URI;
import java.time.LocalDateTime;

@Entity
@Table(name = "region")
public class Region {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "region_id")
    private Long id;

    @Column(name = "parent_region_id")
    private Long parentRegionId;

    @Column(name = "region_name", nullable = false, length = 50)
    private String name;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @Column(name = "region_level", nullable = false, length = 20)
    private String level;

    @Column(name = "display_order", nullable = false)
    private int displayOrder;

    @Column(name = "active_yn", nullable = false)
    private boolean active;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    protected Region() {
    }

    public Region(Long parentRegionId, String name, String level, int displayOrder) {
        this.parentRegionId = parentRegionId;
        this.name = name;
        this.level = level;
        this.displayOrder = displayOrder;
        this.active = true;
    }

    public Long getId() {
        return id;
    }

    public Long getParentRegionId() {
        return parentRegionId;
    }

    public String getName() {
        return name;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    /**
     * 지역 대표 이미지 주소를 등록하며 빈 값은 미등록으로 처리한다.
     *
     * @author 정효림
     */
    public void updateImageUrl(String imageUrl) {
        if (imageUrl == null || imageUrl.isBlank()) {
            this.imageUrl = null;
            return;
        }
        String value = imageUrl.trim();
        URI uri = URI.create(value);
        if (value.length() > 500 || !value.startsWith("https://") || uri.getHost() == null
                || uri.getUserInfo() != null) {
            throw new IllegalArgumentException("지역 대표 이미지는 500자 이내의 HTTPS 절대 URL이어야 합니다.");
        }
        this.imageUrl = value;
    }

    public String getLevel() {
        return level;
    }

    public int getDisplayOrder() {
        return displayOrder;
    }

    public boolean isActive() {
        return active;
    }

    @PrePersist
    void prePersist() {
        LocalDateTime now = LocalDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
