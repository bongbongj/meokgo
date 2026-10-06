package com.meokgo.server.domain.room.domain;

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
@Table(name = "invite_link")
public class InviteLink {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "invite_link_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false)
    private ExplorationRoom room;

    @Column(name = "invite_token", nullable = false, unique = true, length = 100)
    private String token;

    @Column(name = "active_yn", nullable = false)
    private boolean active;

    @Column(name = "expired_at", nullable = false)
    private LocalDateTime expiredAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    protected InviteLink() {
    }

    public InviteLink(ExplorationRoom room, String token) {
        this.room = room;
        this.token = token;
        this.active = true;
        this.expiredAt = LocalDateTime.now().plusHours(24);
    }

    public boolean isExpired() {
        return !active || expiredAt.isBefore(LocalDateTime.now());
    }

    public Long getId() {
        return id;
    }

    public ExplorationRoom getRoom() {
        return room;
    }

    public String getToken() {
        return token;
    }

    public LocalDateTime getExpiredAt() {
        return expiredAt;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    @PrePersist
    void prePersist() {
        this.createdAt = LocalDateTime.now();
    }
}
