package com.meokgo.server.domain.quest.domain;

import com.meokgo.server.domain.room.domain.DrinkingOption;
import com.meokgo.server.domain.room.domain.ScheduleType;
import com.meokgo.server.domain.room.domain.TimeSlot;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "quest")
public class Quest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "quest_id")
    private Long id;

    @Column(name = "quest_title", nullable = false, length = 100)
    private String title;

    @Column(name = "quest_description", nullable = false, length = 500)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "quest_type", nullable = false, length = 30)
    private QuestType type;

    @Enumerated(EnumType.STRING)
    @Column(name = "schedule_type", nullable = false, length = 30)
    private ScheduleType scheduleType;

    @Enumerated(EnumType.STRING)
    @Column(name = "time_slot", length = 30)
    private TimeSlot timeSlot;

    @Enumerated(EnumType.STRING)
    @Column(name = "drinking_option", length = 30)
    private DrinkingOption drinkingOption;

    @Column(name = "active_yn", nullable = false)
    private boolean active;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    protected Quest() {
    }

    public Quest(String title, String description, QuestType type, ScheduleType scheduleType) {
        this.title = title;
        this.description = description;
        this.type = type;
        this.scheduleType = scheduleType;
        this.timeSlot = TimeSlot.ANY;
        this.drinkingOption = DrinkingOption.ANY;
        this.active = true;
    }

    public Long getId() {
        return id;
    }

    public String getTitle() {
        return title;
    }

    public String getDescription() {
        return description;
    }

    public QuestType getType() {
        return type;
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
