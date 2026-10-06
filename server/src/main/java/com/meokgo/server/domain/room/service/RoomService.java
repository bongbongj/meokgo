package com.meokgo.server.domain.room.service;

import com.meokgo.server.api.room.dto.CreateRoomRequest;
import com.meokgo.server.api.room.dto.CreateRoomResponse;
import com.meokgo.server.api.room.dto.RoomParticipantSummary;
import com.meokgo.server.api.room.dto.StartVoteResponse;
import com.meokgo.server.api.room.dto.WaitingStatusResponse;
import com.meokgo.server.domain.region.domain.Region;
import com.meokgo.server.domain.region.repository.RegionRepository;
import com.meokgo.server.domain.room.domain.ExplorationCondition;
import com.meokgo.server.domain.room.domain.ExplorationRoom;
import com.meokgo.server.domain.room.domain.InviteLink;
import com.meokgo.server.domain.room.domain.ParticipantRole;
import com.meokgo.server.domain.room.domain.RoomParticipant;
import com.meokgo.server.domain.room.repository.ExplorationConditionRepository;
import com.meokgo.server.domain.room.repository.ExplorationRoomRepository;
import com.meokgo.server.domain.room.repository.InviteLinkRepository;
import com.meokgo.server.domain.room.repository.RoomParticipantRepository;
import com.meokgo.server.domain.user.domain.DeviceUser;
import com.meokgo.server.domain.user.repository.DeviceUserRepository;
import com.meokgo.server.domain.vote.domain.Vote;
import com.meokgo.server.domain.vote.repository.VoteRepository;
import com.meokgo.server.global.error.BusinessException;
import com.meokgo.server.global.error.ErrorCode;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RoomService {

    private final DeviceUserRepository deviceUserRepository;
    private final RegionRepository regionRepository;
    private final ExplorationRoomRepository roomRepository;
    private final ExplorationConditionRepository conditionRepository;
    private final InviteLinkRepository inviteLinkRepository;
    private final RoomParticipantRepository participantRepository;
    private final VoteRepository voteRepository;

    public RoomService(
            DeviceUserRepository deviceUserRepository,
            RegionRepository regionRepository,
            ExplorationRoomRepository roomRepository,
            ExplorationConditionRepository conditionRepository,
            InviteLinkRepository inviteLinkRepository,
            RoomParticipantRepository participantRepository,
            VoteRepository voteRepository
    ) {
        this.deviceUserRepository = deviceUserRepository;
        this.regionRepository = regionRepository;
        this.roomRepository = roomRepository;
        this.conditionRepository = conditionRepository;
        this.inviteLinkRepository = inviteLinkRepository;
        this.participantRepository = participantRepository;
        this.voteRepository = voteRepository;
    }

    @Transactional
    public CreateRoomResponse createRoom(String deviceKey, CreateRoomRequest request) {
        DeviceUser hostUser = deviceUserRepository.findByDeviceKey(deviceKey)
                .orElseGet(() -> deviceUserRepository.save(DeviceUser.create(deviceKey, "호스트")));
        Region region = regionRepository.findById(request.regionId())
                .orElseThrow(() -> new BusinessException(ErrorCode.REGION_NOT_FOUND));

        ExplorationRoom room = roomRepository.save(ExplorationRoom.create(hostUser, region, createRoomCode()));
        conditionRepository.save(new ExplorationCondition(
                room,
                request.scheduleType(),
                request.timeSlot(),
                request.budgetMin(),
                request.budgetMax(),
                request.drinkingOption(),
                request.avoidFoods()
        ));

        RoomParticipant participant = participantRepository.save(RoomParticipant.host(room, hostUser, hostNickname(hostUser)));
        InviteLink inviteLink = inviteLinkRepository.save(new InviteLink(room, createInviteToken()));

        return new CreateRoomResponse(
                room.getId(),
                room.getRoomCode(),
                room.getStatus().name(),
                room.getMaxParticipantCount(),
                "https://meokgo.app/invite/" + inviteLink.getToken(),
                new RoomParticipantSummary(participant.getId(), participant.getNickname(), participant.getRole().name(), true)
        );
    }

    @Transactional(readOnly = true)
    public WaitingStatusResponse getWaitingStatus(String deviceKey, Long roomId) {
        ExplorationRoom room = findRoom(roomId);
        DeviceUser user = deviceUserRepository.findByDeviceKey(deviceKey)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        RoomParticipant current = participantRepository.findByRoomAndUser(room, user)
                .orElseThrow(() -> new BusinessException(ErrorCode.PARTICIPANT_NOT_FOUND));

        List<RoomParticipantSummary> participants = participantRepository.findByRoomOrderByIdAsc(room)
                .stream()
                .map(participant -> new RoomParticipantSummary(
                        participant.getId(),
                        participant.getNickname(),
                        participant.getRole().name(),
                        true
                ))
                .toList();

        long remainingSeconds = Math.max(
                0,
                Duration.between(LocalDateTime.now(), room.getHostTakeoverAvailableAt()).toSeconds()
        );
        boolean isHost = current.getRole() == ParticipantRole.HOST;
        boolean canStartVote = isHost && room.isJoinable() && participants.size() >= 1;

        return new WaitingStatusResponse(
                room.getId(),
                room.getStatus().name(),
                participants,
                isHost,
                false,
                remainingSeconds == 0,
                room.getHostTakeoverAvailableAt(),
                remainingSeconds,
                !isHost && remainingSeconds == 0,
                canStartVote
        );
    }

    @Transactional
    public StartVoteResponse startVote(String deviceKey, Long roomId) {
        ExplorationRoom room = findRoom(roomId);
        DeviceUser user = deviceUserRepository.findByDeviceKey(deviceKey)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        RoomParticipant host = participantRepository.findByRoomAndUser(room, user)
                .orElseThrow(() -> new BusinessException(ErrorCode.PARTICIPANT_NOT_FOUND));
        if (host.getRole() != ParticipantRole.HOST) {
            throw new BusinessException(ErrorCode.ROOM_FORBIDDEN);
        }
        if (!room.isJoinable()) {
            throw new BusinessException(ErrorCode.ROOM_ALREADY_STARTED);
        }

        room.startVote();
        participantRepository.findByRoomOrderByIdAsc(room)
                .forEach(RoomParticipant::startVoting);
        Vote vote = voteRepository.findByRoom(room)
                .orElseGet(() -> voteRepository.save(new Vote(room)));

        return new StartVoteResponse(room.getId(), room.getStatus().name(), vote.getId());
    }

    private ExplorationRoom findRoom(Long roomId) {
        return roomRepository.findById(roomId)
                .orElseThrow(() -> new BusinessException(ErrorCode.ROOM_NOT_FOUND));
    }

    private String hostNickname(DeviceUser user) {
        if (user.getNickname() == null || user.getNickname().isBlank()) {
            return "호스트";
        }
        return user.getNickname();
    }

    private String createRoomCode() {
        return "MGO" + UUID.randomUUID().toString().replace("-", "").substring(0, 6).toUpperCase();
    }

    private String createInviteToken() {
        return UUID.randomUUID().toString().replace("-", "").substring(0, 12);
    }
}
