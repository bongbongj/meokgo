package com.meokgo.server.domain.exploration.repository;

import com.meokgo.server.domain.exploration.domain.QuestProgress;
import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface QuestProgressRepository extends JpaRepository<QuestProgress, Long> {

    List<QuestProgress> findByFinalQuestIdIn(Collection<Long> finalQuestIds);
}
