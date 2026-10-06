package com.meokgo.server.api.room;

import com.meokgo.server.api.room.dto.CreateRoomRequest;
import com.meokgo.server.api.room.dto.CreateRoomResponse;
import com.meokgo.server.api.room.dto.StartVoteResponse;
import com.meokgo.server.api.room.dto.WaitingStatusResponse;
import com.meokgo.server.domain.room.service.RoomService;
import com.meokgo.server.global.response.ApiResponse;
import com.meokgo.server.global.web.DeviceKey;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/rooms")
public class RoomController {

    private final RoomService roomService;

    public RoomController(RoomService roomService) {
        this.roomService = roomService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<CreateRoomResponse>> createRoom(
            @DeviceKey String deviceKey,
            @Valid @RequestBody CreateRoomRequest request
    ) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(roomService.createRoom(deviceKey, request)));
    }

    @GetMapping("/{roomId}/waiting-status")
    public ApiResponse<WaitingStatusResponse> getWaitingStatus(
            @DeviceKey String deviceKey,
            @PathVariable Long roomId
    ) {
        return ApiResponse.success(roomService.getWaitingStatus(deviceKey, roomId));
    }

    @PostMapping("/{roomId}/vote/start")
    public ApiResponse<StartVoteResponse> startVote(
            @DeviceKey String deviceKey,
            @PathVariable Long roomId
    ) {
        return ApiResponse.success(roomService.startVote(deviceKey, roomId));
    }
}
