package com.meokgo.server.domain.room.repository;

import com.meokgo.server.domain.room.domain.ExplorationRoom;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ExplorationRoomRepository extends JpaRepository<ExplorationRoom, Long> {

    Optional<ExplorationRoom> findByRoomCode(String roomCode);
}
