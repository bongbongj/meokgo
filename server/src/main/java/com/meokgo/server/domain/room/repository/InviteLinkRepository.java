package com.meokgo.server.domain.room.repository;

import com.meokgo.server.domain.room.domain.InviteLink;
import jakarta.persistence.LockModeType;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface InviteLinkRepository extends JpaRepository<InviteLink, Long> {

    Optional<InviteLink> findByToken(String token);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select link from InviteLink link where link.token = :token")
    Optional<InviteLink> findByTokenForUpdate(@Param("token") String token);
}
