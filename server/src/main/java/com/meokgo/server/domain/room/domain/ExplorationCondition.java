package com.meokgo.server.domain.room.domain;

import com.meokgo.server.api.food.dto.FoodPreferenceResponse;
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
import java.util.List;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

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

    @Enumerated(EnumType.STRING)
    @Column(name = "drinking_option", nullable = false, length = 30)
    private DrinkingOption drinkingOption;

    @Column(name = "avoid_foods", length = 500)
    private String avoidFoods;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "recognized_avoid_keywords", nullable = false)
    private List<String> recognizedAvoidKeywords;

    @Column(name = "dictionary_version", nullable = false, length = 30)
    private String dictionaryVersion;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    protected ExplorationCondition() {
    }

    public ExplorationCondition(ExplorationRoom room, ScheduleType scheduleType, TimeSlot timeSlot,
            DrinkingOption drinkingOption, FoodPreferenceResponse preference) {
        this.room = room;
        this.scheduleType = scheduleType;
        this.timeSlot = timeSlot;
        this.drinkingOption = drinkingOption;
        this.avoidFoods = preference.avoidFoods();
        this.recognizedAvoidKeywords = List.copyOf(preference.recognizedAvoidKeywords());
        this.dictionaryVersion = preference.dictionaryVersion();
    }

    public ScheduleType getScheduleType() {
        return scheduleType;
    }

    public TimeSlot getTimeSlot() {
        return timeSlot;
    }

    public DrinkingOption getDrinkingOption() {
        return drinkingOption;
    }

    public String getAvoidFoods() {
        return avoidFoods;
    }

    public List<String> getRecognizedAvoidKeywords() {
        return List.copyOf(recognizedAvoidKeywords);
    }

    public String getDictionaryVersion() {
        return dictionaryVersion;
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
