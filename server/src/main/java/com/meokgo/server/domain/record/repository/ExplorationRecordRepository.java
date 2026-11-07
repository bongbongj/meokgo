package com.meokgo.server.domain.record.repository;

import com.meokgo.server.domain.record.domain.ExplorationRecord;
import com.meokgo.server.domain.room.domain.ExplorationRoom;
import com.meokgo.server.domain.user.domain.DeviceUser;
import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ExplorationRecordRepository extends JpaRepository<ExplorationRecord, Long> {

    @EntityGraph(attributePaths = "region")
    Slice<ExplorationRecord> findByUserOrderByCreatedAtDescIdDesc(DeviceUser user, Pageable pageable);

    @EntityGraph(attributePaths = {"region", "room"})
    Optional<ExplorationRecord> findByIdAndUser(Long id, DeviceUser user);

    Optional<ExplorationRecord> findByRoomAndUser(ExplorationRoom room, DeviceUser user);
    long countByUser(DeviceUser user);

    @Query("select count(distinct r.region.id) from ExplorationRecord r where r.user = :user")
    long countVisitedRegions(@Param("user") DeviceUser user);

    @EntityGraph(attributePaths = "region")
    List<ExplorationRecord> findByUserOrderByCreatedAtAscIdAsc(DeviceUser user);

    interface PopularRegion {
        Long getRegionId();
        String getRegionName();
        long getExplorationCount();
    }

    @Query("""
            select r.region.id as regionId, r.region.name as regionName,
                count(distinct r.room.id) as explorationCount
            from ExplorationRecord r where r.region.active = true
            group by r.region.id, r.region.name
            order by count(distinct r.room.id) desc, r.region.id asc
            """)
    List<PopularRegion> findPopularRegions(Pageable pageable);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select r from ExplorationRecord r where r.id = :id and r.user = :user")
    Optional<ExplorationRecord> findOwnedForUpdate(@Param("id") Long id, @Param("user") DeviceUser user);
}

