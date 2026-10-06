package com.meokgo.server.domain.region.repository;

import com.meokgo.server.domain.region.domain.Region;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RegionRepository extends JpaRepository<Region, Long> {

    List<Region> findByActiveTrueAndNameContainingIgnoreCaseOrderByDisplayOrderAscNameAsc(String keyword);

    List<Region> findByActiveTrueAndParentRegionIdOrderByDisplayOrderAscNameAsc(Long parentRegionId);

    List<Region> findByActiveTrueOrderByDisplayOrderAscNameAsc();
}
