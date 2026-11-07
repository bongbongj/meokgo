package com.meokgo.server.domain.room.repository;

import com.meokgo.server.domain.room.domain.ExplorationCondition;
import com.meokgo.server.domain.room.domain.ExplorationRoom;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ExplorationConditionRepository extends JpaRepository<ExplorationCondition, Long> {

    Optional<ExplorationCondition> findByRoom(ExplorationRoom room);
}
