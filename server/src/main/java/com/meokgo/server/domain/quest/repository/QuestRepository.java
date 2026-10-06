package com.meokgo.server.domain.quest.repository;

import com.meokgo.server.domain.quest.domain.Quest;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface QuestRepository extends JpaRepository<Quest, Long> {

    List<Quest> findTop6ByActiveTrueOrderByIdAsc();
}
