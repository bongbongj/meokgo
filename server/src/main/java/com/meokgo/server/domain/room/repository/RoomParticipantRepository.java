package com.meokgo.server.domain.room.repository;

import com.meokgo.server.domain.room.domain.ExplorationRoom;
import com.meokgo.server.domain.room.domain.ParticipantRole;
import com.meokgo.server.domain.room.domain.ParticipantStatus;
import com.meokgo.server.domain.room.domain.RoomParticipant;
import com.meokgo.server.domain.room.domain.RoomStatus;
import com.meokgo.server.domain.user.domain.DeviceUser;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface RoomParticipantRepository extends JpaRepository<RoomParticipant, Long> {

    List<RoomParticipant> findByRoomOrderByIdAsc(ExplorationRoom room);

    Optional<RoomParticipant> findByRoomAndUser(ExplorationRoom room, DeviceUser user);

    Optional<RoomParticipant> findByRoomAndRole(ExplorationRoom room, ParticipantRole role);

    boolean existsByRoomAndNickname(ExplorationRoom room, String nickname);

    @Query("""
            select participant from RoomParticipant participant join fetch participant.room room
            where participant.user = :user and participant.status <> :left
                and room.status not in :terminalStatuses and room.expiredAt > :now
            order by participant.joinedAt desc, participant.id desc
            """)
    List<RoomParticipant> findActiveByUser(@Param("user") DeviceUser user, @Param("left") ParticipantStatus left,
            @Param("terminalStatuses") List<RoomStatus> terminalStatuses, @Param("now") LocalDateTime now,
            Pageable pageable);

    long countByRoom(ExplorationRoom room);
}
