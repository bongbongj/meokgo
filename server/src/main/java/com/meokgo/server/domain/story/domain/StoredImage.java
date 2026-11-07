package com.meokgo.server.domain.story.domain;

import com.meokgo.server.domain.record.domain.ExplorationRecord;
import jakarta.persistence.Column;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.MappedSuperclass;
import java.time.LocalDateTime;
import lombok.Getter;

@Getter
@MappedSuperclass
public abstract class StoredImage {
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "record_id", nullable = false)
    protected ExplorationRecord record;
    @Column(name = "storage_provider", nullable = false, length = 10)
    protected String storageProvider = "LOCAL";
    @Column(name = "stored_path", nullable = false, length = 500)
    protected String storedPath;
    @Column(name = "expired_at", nullable = false)
    protected LocalDateTime expiredAt;
    @Column(name = "deleted_yn", nullable = false)
    protected boolean deleted;
    @Column(name = "created_at", nullable = false, updatable = false)
    protected LocalDateTime createdAt;

    protected StoredImage() {
    }

    protected StoredImage(ExplorationRecord record, String storedPath) {
        this.record = record;
        this.storedPath = storedPath;
        this.createdAt = LocalDateTime.now();
        this.expiredAt = createdAt.plusDays(30);
    }

    public boolean available(LocalDateTime now) {
        return !deleted && expiredAt.isAfter(now);
    }

    public void markDeleted() {
        this.deleted = true;
    }
}
