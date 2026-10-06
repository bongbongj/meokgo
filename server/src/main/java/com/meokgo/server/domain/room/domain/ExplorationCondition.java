package com.meokgo.server.domain.room.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "exploration_condition")
public class ExplorationCondition {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "condition_id")
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false, unique = true)
    private ExplorationRoom room;

    @Enumerated(EnumType.STRING)
    @Column(name = "schedule_type", nullable = false, length = 30)
    private ScheduleType scheduleType;

    @Enumerated(EnumType.STRING)
    @Column(name = "time_slot", length = 30)
    private TimeSlot timeSlot;

    @Column(name = "budget_min")
    private Integer budgetMin;

    @Column(name = "budget_max")
    private Integer budgetMax;

    @Enumerated(EnumType.STRING)
    @Column(name = "drinking_option", nullable = false, length = 30)
    private DrinkingOption drinkingOption;

    @Column(name = "avoid_foods", length = 500)
    private String avoidFoods;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    protected ExplorationCondition() {
    }

    public ExplorationCondition(
            ExplorationRoom room,
            ScheduleType scheduleType,
            TimeSlot timeSlot,
            Integer budgetMin,
            Integer budgetMax,
            DrinkingOption drinkingOption,
            String avoidFoods
    ) {
        this.room = room;
        this.scheduleType = scheduleType;
        this.timeSlot = timeSlot;
        this.budgetMin = budgetMin;
        this.budgetMax = budgetMax;
        this.drinkingOption = drinkingOption;
        this.avoidFoods = avoidFoods;
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
