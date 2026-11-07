package com.meokgo.server.domain.room.service;

import com.meokgo.server.domain.room.domain.ExplorationRoom;
import com.meokgo.server.domain.room.domain.ParticipantRole;
import com.meokgo.server.domain.room.domain.ParticipantStatus;
import com.meokgo.server.domain.room.domain.RoomParticipant;
import com.meokgo.server.domain.room.repository.ExplorationRoomRepository;
import com.meokgo.server.domain.room.repository.RoomParticipantRepository;
import com.meokgo.server.domain.user.domain.DeviceUser;
import com.meokgo.server.domain.user.repository.DeviceUserRepository;
import com.meokgo.server.global.error.BusinessException;
import com.meokgo.server.global.error.ErrorCode;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * 방 접근과 접속 갱신을 같은 잠금으로 처리하여 권한 이전과 기존 방장 요청의 경합을 방지한다.
 *
 * @author 정효림
 */
@Service
@Transactional(propagation = Propagation.MANDATORY)
public class RoomAccessService {

    public record Context(ExplorationRoom room, RoomParticipant participant) {
    }

    private final ExplorationRoomRepository roomRepository;
    private final RoomParticipantRepository participantRepository;
    private final DeviceUserRepository userRepository;
    private final long connectionTimeoutSeconds;

    public RoomAccessService(ExplorationRoomRepository roomRepository, RoomParticipantRepository participantRepository,
            DeviceUserRepository userRepository,
            @Value("${app.room.connection-timeout-seconds:30}") long connectionTimeoutSeconds) {
        this.roomRepository = roomRepository;
        this.participantRepository = participantRepository;
        this.userRepository = userRepository;
        this.connectionTimeoutSeconds = connectionTimeoutSeconds;
    }

    public Context access(String deviceKey, Long roomId) {
        ExplorationRoom room = roomRepository.findByIdForUpdate(roomId)
                .orElseThrow(() -> new BusinessException(ErrorCode.ROOM_NOT_FOUND));
        DeviceUser user = userRepository.findByDeviceKey(deviceKey)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        RoomParticipant participant = participantRepository.findByRoomAndUser(room, user)
                .filter(value -> value.getStatus() != ParticipantStatus.LEFT)
                .orElseThrow(() -> new BusinessException(ErrorCode.PARTICIPANT_NOT_FOUND));
        room.expireIfDue();
        participant.connect();
        return new Context(room, participant);
    }

    public boolean connected(RoomParticipant participant, LocalDateTime now) {
        return participant.isConnected(now, connectionTimeoutSeconds);
    }

    public List<RoomParticipant> participants(ExplorationRoom room) {
        return participantRepository.findByRoomOrderByIdAsc(room).stream()
                .filter(value -> value.getStatus() != ParticipantStatus.LEFT).toList();
    }

    public void requireActive(ExplorationRoom room) {
        if (!room.isActive()) {
            throw new BusinessException(ErrorCode.ROOM_CLOSED);
        }
    }

    public void requireHost(RoomParticipant participant) {
        if (participant.getRole() != ParticipantRole.HOST) {
            throw new BusinessException(ErrorCode.ROOM_FORBIDDEN);
        }
    }
}
