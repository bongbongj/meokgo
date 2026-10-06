package com.meokgo.server.domain.region.domain;

import com.meokgo.server.domain.user.domain.DeviceUser;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_recent_region")
public class UserRecentRegion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "recent_region_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private DeviceUser user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "region_id", nullable = false)
    private Region region;

    @Column(name = "selected_at", nullable = false)
    private LocalDateTime selectedAt;

    protected UserRecentRegion() {
    }

    public UserRecentRegion(DeviceUser user, Region region) {
        this.user = user;
        this.region = region;
    }

    public Long getId() {
        return id;
    }

    public DeviceUser getUser() {
        return user;
    }

    public Region getRegion() {
        return region;
    }

    public LocalDateTime getSelectedAt() {
        return selectedAt;
    }

    @PrePersist
    void prePersist() {
        this.selectedAt = LocalDateTime.now();
    }
}
