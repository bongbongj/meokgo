package com.meokgo.server.domain.story.repository;

import com.meokgo.server.domain.record.domain.ExplorationRecord;
import com.meokgo.server.domain.story.domain.RecordPhoto;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface RecordPhotoRepository extends JpaRepository<RecordPhoto, Long> {
    List<RecordPhoto> findByRecordAndDeletedFalseAndExpiredAtAfterOrderByPhotoOrderAsc(
            ExplorationRecord record, LocalDateTime now);
    Optional<RecordPhoto> findByIdAndRecord(Long id, ExplorationRecord record);
    List<RecordPhoto> findByDeletedFalseAndExpiredAtLessThanEqualOrderByIdAsc(LocalDateTime now, Pageable pageable);

    @Query("select coalesce(max(p.photoOrder), 0) from RecordPhoto p where p.record = :record")
    int maxPhotoOrder(@Param("record") ExplorationRecord record);
}
