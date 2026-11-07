package com.meokgo.server.domain.room.repository;

import com.meokgo.server.domain.room.domain.ExplorationRoom;
import com.meokgo.server.domain.room.domain.RoomStatus;
import jakarta.persistence.LockModeType;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ExplorationRoomRepository extends JpaRepository<ExplorationRoom, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select room from ExplorationRoom room where room.id = :roomId")
    Optional<ExplorationRoom> findByIdForUpdate(@Param("roomId") Long roomId);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("""
            update ExplorationRoom room set room.status = :expired, room.updatedAt = :now
            where room.expiredAt <= :now and room.status not in :terminalStatuses
            """)
    int expireDueRooms(@Param("now") LocalDateTime now, @Param("expired") RoomStatus expired,
            @Param("terminalStatuses") Collection<RoomStatus> terminalStatuses);

    Optional<ExplorationRoom> findByRoomCode(String roomCode);
}
