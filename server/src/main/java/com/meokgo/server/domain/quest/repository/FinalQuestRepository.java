package com.meokgo.server.domain.quest.repository;

import com.meokgo.server.domain.quest.domain.FinalQuest;
import com.meokgo.server.domain.room.domain.ExplorationRoom;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FinalQuestRepository extends JpaRepository<FinalQuest, Long> {

    List<FinalQuest> findByRoomOrderByRankNoAsc(ExplorationRoom room);
}
