package com.meokgo.server.domain.vote.repository;

import com.meokgo.server.domain.room.domain.ExplorationRoom;
import com.meokgo.server.domain.vote.domain.Vote;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VoteRepository extends JpaRepository<Vote, Long> {

    Optional<Vote> findByRoom(ExplorationRoom room);
}
