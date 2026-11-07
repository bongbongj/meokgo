package com.meokgo.server.domain.vote.domain;

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
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import java.util.List;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "vote")
public class Vote {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "vote_id")
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false, unique = true)
    private ExplorationRoom room;

    @Enumerated(EnumType.STRING)
    @Column(name = "vote_status", nullable = false, length = 20)
    private VoteStatus status;

    @Column(name = "min_select_count", nullable = false)
    private int minSelectCount;

    @Column(name = "max_select_count", nullable = false)
    private int maxSelectCount;

    @Column(name = "not_voted_count_at_close")
    private Integer notVotedCountAtClose;

    @Column(name = "close_confirmed_yn", nullable = false)
    private boolean closeConfirmed;

    @Column(name = "closed_at")
    private LocalDateTime closedAt;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "tie_break_candidate_ids")
    private List<Long> tieBreakCandidateIds;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tie_break_host_participant_id")
    private RoomParticipant tieBreakHost;

    @Column(name = "started_at", nullable = false, updatable = false)
    private LocalDateTime startedAt;

    protected Vote() {
    }

    public Vote(ExplorationRoom room) {
        this.room = room;
        this.status = VoteStatus.OPEN;
        this.minSelectCount = 1;
        this.maxSelectCount = 3;
    }

    public void close(int notVotedCount) {
        this.status = VoteStatus.CLOSED;
        this.notVotedCountAtClose = notVotedCount;
        this.closeConfirmed = true;
        this.closedAt = LocalDateTime.now();
    }

    public void selectTieBreak(List<Long> candidateIds, RoomParticipant host) {
        this.tieBreakCandidateIds = List.copyOf(candidateIds);
        this.tieBreakHost = host;
    }

    public List<Long> getTieBreakCandidateIds() {
        return tieBreakCandidateIds == null ? List.of() : List.copyOf(tieBreakCandidateIds);
    }

    public RoomParticipant getTieBreakHost() {
        return tieBreakHost;
    }

    public Integer getNotVotedCountAtClose() {
        return notVotedCountAtClose;
    }

    public boolean isCloseConfirmed() {
        return closeConfirmed;
    }

    public LocalDateTime getClosedAt() {
        return closedAt;
    }

    public Long getId() {
        return id;
    }

    public ExplorationRoom getRoom() {
        return room;
    }

    public VoteStatus getStatus() {
        return status;
    }

    public int getMinSelectCount() {
        return minSelectCount;
    }

    public int getMaxSelectCount() {
        return maxSelectCount;
    }

    @PrePersist
    void prePersist() {
        this.startedAt = LocalDateTime.now();
    }
}
