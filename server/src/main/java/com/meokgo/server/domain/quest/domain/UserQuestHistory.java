package com.meokgo.server.domain.quest.domain;

import com.meokgo.server.domain.room.domain.ExplorationRoom;
import com.meokgo.server.domain.user.domain.DeviceUser;
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
import java.time.LocalDateTime;

@Entity
@Table(name = "user_quest_history", indexes = @Index(name = "idx_history_user_quest", columnList = "user_id,quest_id"))
public class UserQuestHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "history_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private DeviceUser user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "quest_id", nullable = false)
    private Quest quest;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false)
    private ExplorationRoom room;

    @Column(name = "completed_at", nullable = false)
    private LocalDateTime completedAt;

    protected UserQuestHistory() {
    }

    public UserQuestHistory(DeviceUser user, Quest quest, ExplorationRoom room, LocalDateTime completedAt) {
        this.user = user;
        this.quest = quest;
        this.room = room;
        this.completedAt = completedAt;
    }
}
