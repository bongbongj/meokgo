package com.meokgo.server.domain.user.repository;

import com.meokgo.server.domain.user.domain.DeviceUser;
import jakarta.persistence.LockModeType;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface DeviceUserRepository extends JpaRepository<DeviceUser, Long> {

    Optional<DeviceUser> findByDeviceKey(String deviceKey);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select user from DeviceUser user where user.deviceKey = :deviceKey")
    Optional<DeviceUser> findByDeviceKeyForUpdate(@Param("deviceKey") String deviceKey);
}
