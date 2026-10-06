package com.meokgo.server.domain.quest.domain;

import com.meokgo.server.domain.room.domain.ExplorationRoom;
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
@Table(name = "room_quest_candidate")
public class RoomQuestCandidate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "candidate_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false)
    private ExplorationRoom room;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "quest_id", nullable = false)
    private Quest quest;

    @Column(name = "candidate_order", nullable = false)
    private int candidateOrder;

    @Column(name = "selected_reason", length = 200)
    private String selectedReason;

    @Column(name = "suppressed_by_history_yn", nullable = false)
    private boolean suppressedByHistory;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    protected RoomQuestCandidate() {
    }

    public RoomQuestCandidate(ExplorationRoom room, Quest quest, int candidateOrder, String selectedReason) {
        this.room = room;
        this.quest = quest;
        this.candidateOrder = candidateOrder;
        this.selectedReason = selectedReason;
        this.suppressedByHistory = false;
    }

    public Long getId() {
        return id;
    }

    public Quest getQuest() {
        return quest;
    }

    public int getCandidateOrder() {
        return candidateOrder;
    }

    public String getSelectedReason() {
        return selectedReason;
    }

    @PrePersist
    void prePersist() {
        this.createdAt = LocalDateTime.now();
    }
}
