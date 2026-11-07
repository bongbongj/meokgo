package com.meokgo.server.domain.retention.repository;

import com.meokgo.server.domain.retention.domain.UserRetentionStage;
import com.meokgo.server.domain.user.domain.DeviceUser;
import java.util.List;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRetentionStageRepository extends JpaRepository<UserRetentionStage, Long> {
    @EntityGraph(attributePaths = "stage")
    List<UserRetentionStage> findByUser(DeviceUser user);
}
