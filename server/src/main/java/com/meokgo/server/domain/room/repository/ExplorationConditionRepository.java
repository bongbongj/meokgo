package com.meokgo.server.domain.room.repository;

import com.meokgo.server.domain.room.domain.ExplorationCondition;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ExplorationConditionRepository extends JpaRepository<ExplorationCondition, Long> {
}
