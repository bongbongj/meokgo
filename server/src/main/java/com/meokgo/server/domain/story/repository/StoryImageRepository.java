package com.meokgo.server.domain.story.repository;

import com.meokgo.server.domain.record.domain.ExplorationRecord;
import com.meokgo.server.domain.story.domain.StoryImage;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StoryImageRepository extends JpaRepository<StoryImage, Long> {
    Optional<StoryImage> findByIdAndRecord(Long id, ExplorationRecord record);
    List<StoryImage> findByDeletedFalseAndExpiredAtLessThanEqualOrderByIdAsc(LocalDateTime now, Pageable pageable);
}
