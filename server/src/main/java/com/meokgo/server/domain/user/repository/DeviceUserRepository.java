package com.meokgo.server.domain.user.repository;

import com.meokgo.server.domain.user.domain.DeviceUser;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DeviceUserRepository extends JpaRepository<DeviceUser, Long> {

    Optional<DeviceUser> findByDeviceKey(String deviceKey);
}
