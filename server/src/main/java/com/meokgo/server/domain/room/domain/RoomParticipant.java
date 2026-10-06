package com.meokgo.server.domain.room.domain;

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
@Table(name = "room_participant")
public class RoomParticipant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "participant_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false)
    private ExplorationRoom room;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private DeviceUser user;

    @Column(name = "nickname", nullable = false, length = 10)
    private String nickname;

    @Enumerated(EnumType.STRING)
    @Column(name = "participant_role", nullable = false, length = 20)
    private ParticipantRole role;

    @Enumerated(EnumType.STRING)
    @Column(name = "participant_status", nullable = false, length = 20)
    private ParticipantStatus status;

    @Column(name = "avatar_color", length = 20)
    private String avatarColor;

    @Column(name = "restored_from_device_yn", nullable = false)
    private boolean restoredFromDevice;

    @Column(name = "vote_submitted_yn", nullable = false)
    private boolean voteSubmitted;

    @Column(name = "vote_submitted_at")
    private LocalDateTime voteSubmittedAt;

    @Column(name = "vote_updated_at")
    private LocalDateTime voteUpdatedAt;

    @Column(name = "last_connected_at")
    private LocalDateTime lastConnectedAt;

    @Column(name = "joined_at", nullable = false, updatable = false)
    private LocalDateTime joinedAt;

    @Column(name = "left_at")
    private LocalDateTime leftAt;

    protected RoomParticipant() {
    }

    private RoomParticipant(ExplorationRoom room, DeviceUser user, String nickname, ParticipantRole role) {
        this.room = room;
        this.user = user;
        this.nickname = nickname;
        this.role = role;
        this.status = ParticipantStatus.WAITING;
        this.restoredFromDevice = false;
        this.voteSubmitted = false;
        this.lastConnectedAt = LocalDateTime.now();
    }

    public static RoomParticipant host(ExplorationRoom room, DeviceUser user, String nickname) {
        return new RoomParticipant(room, user, nickname, ParticipantRole.HOST);
    }

    public static RoomParticipant member(ExplorationRoom room, DeviceUser user, String nickname) {
        return new RoomParticipant(room, user, nickname, ParticipantRole.MEMBER);
    }

    public void restore() {
        this.restoredFromDevice = true;
        this.lastConnectedAt = LocalDateTime.now();
    }

    public void startVoting() {
        this.status = ParticipantStatus.VOTING;
    }

    public void submitVote() {
        LocalDateTime now = LocalDateTime.now();
        if (!voteSubmitted) {
            this.voteSubmittedAt = now;
        }
        this.voteSubmitted = true;
        this.voteUpdatedAt = now;
    }

    public Long getId() {
        return id;
    }

    public ExplorationRoom getRoom() {
        return room;
    }

    public DeviceUser getUser() {
        return user;
    }

    public String getNickname() {
        return nickname;
    }

    public ParticipantRole getRole() {
        return role;
    }

    public ParticipantStatus getStatus() {
        return status;
    }

    public boolean isVoteSubmitted() {
        return voteSubmitted;
    }

    public boolean isRestoredFromDevice() {
        return restoredFromDevice;
    }

    @PrePersist
    void prePersist() {
        this.joinedAt = LocalDateTime.now();
    }

    @PreUpdate
    void preUpdate() {
        this.lastConnectedAt = LocalDateTime.now();
    }
}
