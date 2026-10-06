package com.meokgo.server.domain.room.repository;

import com.meokgo.server.domain.room.domain.InviteLink;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InviteLinkRepository extends JpaRepository<InviteLink, Long> {

    Optional<InviteLink> findByToken(String token);
}
