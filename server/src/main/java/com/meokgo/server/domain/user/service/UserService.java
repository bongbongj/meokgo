package com.meokgo.server.domain.user.service;

import com.meokgo.server.api.user.dto.BootstrapResponse;
import com.meokgo.server.api.user.dto.NicknameResponse;
import com.meokgo.server.domain.room.domain.ParticipantStatus;
import com.meokgo.server.domain.room.domain.RoomParticipant;
import com.meokgo.server.domain.room.domain.RoomStatus;
import com.meokgo.server.domain.room.repository.RoomParticipantRepository;
import com.meokgo.server.domain.user.domain.DeviceUser;
import com.meokgo.server.domain.user.repository.DeviceUserRepository;
import com.meokgo.server.global.error.BusinessException;
import com.meokgo.server.global.error.ErrorCode;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class UserService {

    private final DeviceUserRepository deviceUserRepository;
    private final RoomParticipantRepository participantRepository;

    public UserService(DeviceUserRepository deviceUserRepository, RoomParticipantRepository participantRepository) {
        this.deviceUserRepository = deviceUserRepository;
        this.participantRepository = participantRepository;
    }

    public BootstrapResponse getBootstrap(String deviceKey) {
        return deviceUserRepository.findByDeviceKey(deviceKey)
                .map(this::toExistingBootstrapResponse)
                .orElseGet(this::toFirstLaunchBootstrapResponse);
    }

    @Transactional
    public NicknameResponse setInitialNickname(String deviceKey, String nickname) {
        DeviceUser user = deviceUserRepository.findByDeviceKey(deviceKey)
                .map(existingUser -> updateNickname(existingUser, nickname))
                .orElseGet(() -> deviceUserRepository.save(DeviceUser.create(deviceKey, nickname)));

        return new NicknameResponse(user.getId(), user.getNickname(), user.isFirstLaunch());
    }

    @Transactional
    public NicknameResponse changeNickname(String deviceKey, String nickname) {
        DeviceUser user = deviceUserRepository.findByDeviceKey(deviceKey)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        user.changeNickname(nickname);
        return new NicknameResponse(user.getId(), user.getNickname(), null);
    }

    private DeviceUser updateNickname(DeviceUser user, String nickname) {
        user.changeNickname(nickname);
        return user;
    }

    private BootstrapResponse toExistingBootstrapResponse(DeviceUser user) {
        RoomParticipant participant = participantRepository.findActiveByUser(user, ParticipantStatus.LEFT,
                List.of(RoomStatus.FINISHED, RoomStatus.EXPIRED), LocalDateTime.now(), PageRequest.of(0, 1))
                .stream().findFirst().orElse(null);
        return new BootstrapResponse(user.getId(), user.getNickname(), user.isFirstLaunch(), participant != null,
                participant == null ? null : participant.getRoom().getId(),
                participant == null ? null : participant.getId(), participant != null,
                participant != null && participant.isVoteSubmitted());
    }

    private BootstrapResponse toFirstLaunchBootstrapResponse() {
        return new BootstrapResponse(
                null,
                null,
                true,
                false,
                null,
                null,
                false,
                false
        );
    }
}
