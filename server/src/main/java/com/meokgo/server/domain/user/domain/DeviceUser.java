package com.meokgo.server.domain.user.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "device_user")
public class DeviceUser {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_id")
    private Long id;

    @Column(name = "device_key", nullable = false, unique = true, length = 100)
    private String deviceKey;

    @Column(name = "nickname", length = 10)
    private String nickname;

    @Column(name = "first_launch_yn", nullable = false)
    private boolean firstLaunch;

    @Column(name = "nickname_updated_at")
    private LocalDateTime nicknameUpdatedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    protected DeviceUser() {
    }

    private DeviceUser(String deviceKey, String nickname) {
        this.deviceKey = deviceKey;
        this.nickname = nickname;
        this.firstLaunch = false;
        this.nicknameUpdatedAt = LocalDateTime.now();
    }

    public static DeviceUser create(String deviceKey, String nickname) {
        return new DeviceUser(deviceKey, nickname);
    }

    public void changeNickname(String nickname) {
        this.nickname = nickname;
        this.firstLaunch = false;
        this.nicknameUpdatedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public String getDeviceKey() {
        return deviceKey;
    }

    public String getNickname() {
        return nickname;
    }

    public boolean isFirstLaunch() {
        return firstLaunch;
    }

    public LocalDateTime getNicknameUpdatedAt() {
        return nicknameUpdatedAt;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
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
