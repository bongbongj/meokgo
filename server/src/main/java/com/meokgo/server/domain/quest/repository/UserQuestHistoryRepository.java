package com.meokgo.server.domain.quest.repository;

import com.meokgo.server.domain.quest.domain.UserQuestHistory;
import com.meokgo.server.domain.user.domain.DeviceUser;
import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserQuestHistoryRepository extends JpaRepository<UserQuestHistory, Long> {

    long countByUser(DeviceUser user);

    interface CompletionCount {
        Long getQuestId();
        long getCompletedParticipantCount();
    }

    @Query("""
            select history.quest.id as questId, count(distinct history.user.id) as completedParticipantCount
            from UserQuestHistory history
            where history.user.id in :userIds and history.quest.id in :questIds
            group by history.quest.id
            """)
    List<CompletionCount> countCompletedParticipants(
            @Param("userIds") Collection<Long> userIds,
            @Param("questIds") Collection<Long> questIds
    );
}
