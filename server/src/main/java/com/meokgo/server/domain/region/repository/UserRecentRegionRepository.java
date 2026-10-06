package com.meokgo.server.domain.region.repository;

import com.meokgo.server.domain.region.domain.UserRecentRegion;
import com.meokgo.server.domain.user.domain.DeviceUser;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRecentRegionRepository extends JpaRepository<UserRecentRegion, Long> {

    List<UserRecentRegion> findTop5ByUserOrderBySelectedAtDesc(DeviceUser user);
}
