package com.meokgo.server.domain.story.domain;

import com.meokgo.server.domain.record.domain.ExplorationRecord;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;

@Getter
@Entity
@Table(name = "record_photo", indexes = @Index(name = "idx_photo_expiration", columnList = "deleted_yn,expired_at"),
        uniqueConstraints = @UniqueConstraint(columnNames = {"record_id", "photo_order"}))
public class RecordPhoto extends StoredImage {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "photo_id")
    private Long id;
    @Column(name = "photo_url", nullable = false, length = 500)
    private String photoUrl = "";
    @Column(name = "photo_order", nullable = false)
    private int photoOrder;

    protected RecordPhoto() {
    }

    public RecordPhoto(ExplorationRecord record, String path, int photoOrder) {
        super(record, path);
        this.photoOrder = photoOrder;
    }

    public void assignUrl() {
        this.photoUrl = "/api/v1/records/" + record.getId() + "/photos/" + id + "/content";
    }
}
