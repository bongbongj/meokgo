package com.meokgo.server.domain.retention.repository;

import com.meokgo.server.domain.retention.domain.RetentionStage;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RetentionStageRepository extends JpaRepository<RetentionStage, Long> {
    List<RetentionStage> findByActiveTrueOrderByDisplayOrderAscIdAsc();
    boolean existsByCode(String code);
    Optional<RetentionStage> findByCode(String code);
}
