package com.meokgo.server.domain.quest.domain;

import com.meokgo.server.domain.room.domain.ExplorationRoom;
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
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.LocalDateTime;

@Entity
@Table(name = "final_quest", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"room_id", "candidate_id"}),
        @UniqueConstraint(columnNames = {"room_id", "rank_no"})
}, indexes = @Index(name = "idx_final_quest_tie_group", columnList = "room_id,tie_group_no"))
public class FinalQuest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "final_quest_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false)
    private ExplorationRoom room;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "candidate_id", nullable = false)
    private RoomQuestCandidate candidate;

    @Column(name = "rank_no", nullable = false)
    private int rankNo;

    @Column(name = "vote_count", nullable = false)
    private int voteCount;

    @Column(name = "tie_break_order")
    private Integer tieBreakOrder;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "selected_by_host_participant_id")
    private RoomParticipant selectedByHost;

    @Column(name = "tie_group_no")
    private Integer tieGroupNo;

    @Enumerated(EnumType.STRING)
    @Column(name = "selection_reason", length = 30)
    private FinalQuestSelectionReason selectionReason;

    @Column(name = "confirmed_at", nullable = false)
    private LocalDateTime confirmedAt;

    protected FinalQuest() {
    }

    public FinalQuest(ExplorationRoom room, RoomQuestCandidate candidate, int rankNo, long voteCount,
            RoomParticipant selectedByHost, Integer tieBreakOrder) {
        this.room = room;
        this.candidate = candidate;
        this.rankNo = rankNo;
        this.voteCount = Math.toIntExact(voteCount);
        this.selectedByHost = selectedByHost;
        this.tieBreakOrder = tieBreakOrder;
        this.tieGroupNo = selectedByHost == null ? null : 1;
        this.selectionReason = selectedByHost == null
                ? FinalQuestSelectionReason.VOTE_RANK : FinalQuestSelectionReason.HOST_TIE_BREAK;
        this.confirmedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public RoomQuestCandidate getCandidate() {
        return candidate;
    }

    public int getRankNo() {
        return rankNo;
    }

    public long getVoteCount() {
        return voteCount;
    }

    public FinalQuestSelectionReason getSelectionReason() {
        return selectionReason;
    }

    public RoomParticipant getSelectedByHost() {
        return selectedByHost;
    }
}
