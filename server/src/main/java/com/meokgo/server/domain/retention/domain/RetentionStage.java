package com.meokgo.server.domain.retention.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;

@Getter
@Entity
@Table(name = "retention_stage")
public class RetentionStage {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "stage_id")
    private Long id;
    @Column(name = "stage_code", nullable = false, unique = true, length = 30)
    private String code;
    @Column(name = "stage_name", nullable = false, length = 50)
    private String name;
    @Column(name = "achievement_condition", nullable = false, length = 300)
    private String achievementCondition;
    @Column(name = "reward_description", nullable = false, length = 300)
    private String rewardDescription;
    @Column(name = "display_order", nullable = false)
    private int displayOrder;
    @Column(name = "active_yn", nullable = false)
    private boolean active = true;

    protected RetentionStage() {
    }

    public void changeAchievementCondition(String condition) {
        this.achievementCondition = condition;
    }

    public RetentionStage(String code, String name, String condition, String reward, int displayOrder) {
        this.code = code;
        this.name = name;
        this.achievementCondition = condition;
        this.rewardDescription = reward;
        this.displayOrder = displayOrder;
    }
}
