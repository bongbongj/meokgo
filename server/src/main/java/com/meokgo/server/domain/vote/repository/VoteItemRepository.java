package com.meokgo.server.domain.vote.repository;

import com.meokgo.server.domain.room.domain.RoomParticipant;
import com.meokgo.server.domain.vote.domain.Vote;
import com.meokgo.server.domain.vote.domain.VoteItem;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface VoteItemRepository extends JpaRepository<VoteItem, Long> {

    List<VoteItem> findByVoteAndParticipant(Vote vote, RoomParticipant participant);

    void deleteByVoteAndParticipant(Vote vote, RoomParticipant participant);

    @Query("""
            select count(vi)
            from VoteItem vi
            where vi.vote = :vote and vi.candidate.id = :candidateId
            """)
    long countByVoteAndCandidateId(@Param("vote") Vote vote, @Param("candidateId") Long candidateId);
}
