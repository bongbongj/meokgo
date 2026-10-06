package com.meokgo.server.domain.room.repository;

import com.meokgo.server.domain.room.domain.ExplorationRoom;
import com.meokgo.server.domain.room.domain.ParticipantRole;
import com.meokgo.server.domain.room.domain.RoomParticipant;
import com.meokgo.server.domain.user.domain.DeviceUser;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RoomParticipantRepository extends JpaRepository<RoomParticipant, Long> {

    List<RoomParticipant> findByRoomOrderByIdAsc(ExplorationRoom room);

    Optional<RoomParticipant> findByRoomAndUser(ExplorationRoom room, DeviceUser user);

    Optional<RoomParticipant> findByRoomAndRole(ExplorationRoom room, ParticipantRole role);

    boolean existsByRoomAndNickname(ExplorationRoom room, String nickname);

    long countByRoom(ExplorationRoom room);
}
