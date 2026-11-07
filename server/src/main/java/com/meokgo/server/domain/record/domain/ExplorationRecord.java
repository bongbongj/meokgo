package com.meokgo.server.domain.record.domain;

import com.meokgo.server.domain.region.domain.Region;
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
@Table(name = "exploration_record", indexes = @Index(name = "idx_record_user_created", columnList = "user_id,created_at"))
public class ExplorationRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "record_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false)
    private ExplorationRoom room;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private DeviceUser user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "region_id", nullable = false)
    private Region region;

    @Column(name = "participant_count", nullable = false)
    private int participantCount;

    @Column(name = "completed_quest_count", nullable = false)
    private int completedQuestCount;

    @Column(name = "record_memo", length = 500)
    private String recordMemo;

    @Column(name = "story_selected_yn", nullable = false)
    private boolean storySelected;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    protected ExplorationRecord() {
    }

    public ExplorationRecord(ExplorationRoom room, DeviceUser user, int participantCount, int completedQuestCount) {
        this.room = room;
        this.user = user;
        this.region = room.getRegion();
        this.participantCount = participantCount;
        this.completedQuestCount = completedQuestCount;
        this.createdAt = LocalDateTime.now();
    }

    public void selectStory() {
        this.storySelected = true;
    }

    public boolean isStorySelected() {
        return storySelected;
    }

    public void changeMemo(String memo) {
        this.recordMemo = memo;
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

    public Region getRegion() {
        return region;
    }

    public int getParticipantCount() {
        return participantCount;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public int getCompletedQuestCount() {
        return completedQuestCount;
    }
}
