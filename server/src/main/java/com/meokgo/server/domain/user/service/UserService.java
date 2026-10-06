package com.meokgo.server.domain.user.service;

import com.meokgo.server.api.user.dto.BootstrapResponse;
import com.meokgo.server.api.user.dto.NicknameResponse;
import com.meokgo.server.domain.user.domain.DeviceUser;
import com.meokgo.server.domain.user.repository.DeviceUserRepository;
import com.meokgo.server.global.error.BusinessException;
import com.meokgo.server.global.error.ErrorCode;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class UserService {

    private final DeviceUserRepository deviceUserRepository;

    public UserService(DeviceUserRepository deviceUserRepository) {
        this.deviceUserRepository = deviceUserRepository;
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
        return new BootstrapResponse(
                user.getId(),
                user.getNickname(),
                user.isFirstLaunch(),
                false,
                null,
                null,
                false,
                false
        );
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
