package com.meokgo.server.domain.region.repository;

import com.meokgo.server.domain.region.domain.Region;
import com.meokgo.server.domain.region.domain.UserRecentRegion;
import com.meokgo.server.domain.user.domain.DeviceUser;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRecentRegionRepository extends JpaRepository<UserRecentRegion, Long> {

    Optional<UserRecentRegion> findFirstByUserAndRegionOrderBySelectedAtDesc(DeviceUser user, Region region);

    List<UserRecentRegion> findTop5ByUserOrderBySelectedAtDesc(DeviceUser user);
}
