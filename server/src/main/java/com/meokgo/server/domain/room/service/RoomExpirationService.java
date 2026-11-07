package com.meokgo.server.domain.room.service;

import com.meokgo.server.domain.room.domain.RoomStatus;
import com.meokgo.server.domain.room.repository.ExplorationRoomRepository;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@ConditionalOnProperty(name = "app.room.expiration.enabled", havingValue = "true", matchIfMissing = true)
public class RoomExpirationService {

    private final ExplorationRoomRepository roomRepository;

    public RoomExpirationService(ExplorationRoomRepository roomRepository) {
        this.roomRepository = roomRepository;
    }

    @Scheduled(fixedDelayString = "${app.room.expiration.interval-ms:60000}",
            initialDelayString = "${app.room.expiration.interval-ms:60000}")
    @Transactional
    public void expireRooms() {
        roomRepository.expireDueRooms(LocalDateTime.now(), RoomStatus.EXPIRED,
                List.of(RoomStatus.FINISHED, RoomStatus.EXPIRED));
    }
}
