package com.meokgo.server.api.user;

import com.meokgo.server.api.user.dto.BootstrapResponse;
import com.meokgo.server.api.user.dto.NicknameRequest;
import com.meokgo.server.api.user.dto.NicknameResponse;
import com.meokgo.server.domain.user.service.UserService;
import com.meokgo.server.global.response.ApiResponse;
import com.meokgo.server.global.web.DeviceKey;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/users/me")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/bootstrap")
    public ApiResponse<BootstrapResponse> getBootstrap(@DeviceKey String deviceKey) {
        return ApiResponse.success(userService.getBootstrap(deviceKey));
    }

    @PostMapping("/nickname")
    public ApiResponse<NicknameResponse> setInitialNickname(
            @DeviceKey String deviceKey,
            @Valid @RequestBody NicknameRequest request
    ) {
        return ApiResponse.success(userService.setInitialNickname(deviceKey, request.nickname()));
    }

    @PatchMapping("/nickname")
    public ApiResponse<NicknameResponse> changeNickname(
            @DeviceKey String deviceKey,
            @Valid @RequestBody NicknameRequest request
    ) {
        return ApiResponse.success(userService.changeNickname(deviceKey, request.nickname()));
    }
}
