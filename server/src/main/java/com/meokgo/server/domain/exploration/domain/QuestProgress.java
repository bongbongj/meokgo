package com.meokgo.server.domain.exploration.domain;

import com.meokgo.server.domain.quest.domain.FinalQuest;
import com.meokgo.server.domain.room.domain.RoomParticipant;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.LocalDateTime;

@Entity
@Table(name = "quest_progress", uniqueConstraints = @UniqueConstraint(columnNames = {"final_quest_id", "participant_id"}),
        indexes = @Index(name = "idx_progress_quest_status", columnList = "final_quest_id,progress_status"))
public class QuestProgress {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "progress_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "final_quest_id", nullable = false)
    private FinalQuest finalQuest;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "participant_id", nullable = false)
    private RoomParticipant participant;

    @Enumerated(EnumType.STRING)
    @Column(name = "progress_status", nullable = false, length = 20)
    private ProgressStatus status;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    protected QuestProgress() {
    }

    public QuestProgress(FinalQuest finalQuest, RoomParticipant participant) {
        this.finalQuest = finalQuest;
        this.participant = participant;
        this.status = ProgressStatus.TODO;
    }

    public void changeCompletion(boolean completed) {
        if (completed == isCompleted()) {
            return;
        }
        this.status = completed ? ProgressStatus.DONE : ProgressStatus.CANCELED;
        this.completedAt = completed ? LocalDateTime.now() : null;
    }

    public FinalQuest getFinalQuest() {
        return finalQuest;
    }

    public RoomParticipant getParticipant() {
        return participant;
    }

    public boolean isCompleted() {
        return status == ProgressStatus.DONE;
    }

    public LocalDateTime getCompletedAt() {
        return completedAt;
    }

    @PrePersist
    @PreUpdate
    void updateTimestamp() {
        this.updatedAt = LocalDateTime.now();
    }
}
