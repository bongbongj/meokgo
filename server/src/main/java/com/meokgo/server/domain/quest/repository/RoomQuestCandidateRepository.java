package com.meokgo.server.domain.quest.repository;

import com.meokgo.server.domain.quest.domain.RoomQuestCandidate;
import com.meokgo.server.domain.room.domain.ExplorationRoom;
import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RoomQuestCandidateRepository extends JpaRepository<RoomQuestCandidate, Long> {

    List<RoomQuestCandidate> findByRoomOrderByCandidateOrderAsc(ExplorationRoom room);

    List<RoomQuestCandidate> findByRoomAndIdIn(ExplorationRoom room, Collection<Long> ids);

    boolean existsByRoom(ExplorationRoom room);
}
