package com.meokgo.server.domain.room.domain;

import com.meokgo.server.domain.region.domain.Region;
import com.meokgo.server.domain.user.domain.DeviceUser;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "exploration_room")
public class ExplorationRoom {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "room_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "host_user_id", nullable = false)
    private DeviceUser hostUser;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "region_id", nullable = false)
    private Region region;

    @Column(name = "room_code", nullable = false, unique = true, length = 20)
    private String roomCode;

    @Enumerated(EnumType.STRING)
    @Column(name = "room_status", nullable = false, length = 30)
    private RoomStatus status;

    @Column(name = "max_participant_count", nullable = false)
    private int maxParticipantCount;

    @Column(name = "vote_started_at")
    private LocalDateTime voteStartedAt;

    @Column(name = "vote_closed_at")
    private LocalDateTime voteClosedAt;

    @Column(name = "vote_reopened_yn", nullable = false)
    private boolean voteReopened;

    @Column(name = "last_host_action_at")
    private LocalDateTime lastHostActionAt;

    @Column(name = "host_takeover_available_at")
    private LocalDateTime hostTakeoverAvailableAt;

    @Column(name = "expired_at", nullable = false)
    private LocalDateTime expiredAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    protected ExplorationRoom() {
    }

    private ExplorationRoom(DeviceUser hostUser, Region region, String roomCode) {
        this.hostUser = hostUser;
        this.region = region;
        this.roomCode = roomCode;
        this.status = RoomStatus.WAITING;
        this.maxParticipantCount = 4;
        this.voteReopened = false;
        this.lastHostActionAt = LocalDateTime.now();
        this.hostTakeoverAvailableAt = this.lastHostActionAt.plusMinutes(5);
        this.expiredAt = this.lastHostActionAt.plusHours(24);
    }

    public static ExplorationRoom create(DeviceUser hostUser, Region region, String roomCode) {
        return new ExplorationRoom(hostUser, region, roomCode);
    }

    public void startVote() {
        this.status = RoomStatus.VOTING;
        this.voteStartedAt = LocalDateTime.now();
        touchHostAction();
    }

    public boolean isJoinable() {
        return status == RoomStatus.WAITING && expiredAt.isAfter(LocalDateTime.now());
    }

    public void touchHostAction() {
        this.lastHostActionAt = LocalDateTime.now();
        this.hostTakeoverAvailableAt = this.lastHostActionAt.plusMinutes(5);
    }

    public Long getId() {
        return id;
    }

    public DeviceUser getHostUser() {
        return hostUser;
    }

    public Region getRegion() {
        return region;
    }

    public String getRoomCode() {
        return roomCode;
    }

    public RoomStatus getStatus() {
        return status;
    }

    public int getMaxParticipantCount() {
        return maxParticipantCount;
    }

    public LocalDateTime getHostTakeoverAvailableAt() {
        return hostTakeoverAvailableAt;
    }

    public LocalDateTime getExpiredAt() {
        return expiredAt;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
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
