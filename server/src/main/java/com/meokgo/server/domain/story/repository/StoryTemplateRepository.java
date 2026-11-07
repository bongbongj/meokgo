package com.meokgo.server.domain.story.repository;

import com.meokgo.server.domain.story.domain.StoryTemplate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StoryTemplateRepository extends JpaRepository<StoryTemplate, Long> {
    List<StoryTemplate> findByActiveTrueOrderByDisplayOrderAscIdAsc();
    Optional<StoryTemplate> findByIdAndActiveTrue(Long id);
}
