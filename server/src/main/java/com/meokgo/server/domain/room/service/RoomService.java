package com.meokgo.server.domain.room.service;

import com.meokgo.server.api.food.dto.FoodPreferenceResponse;
import com.meokgo.server.api.room.dto.CreateRoomRequest;
import com.meokgo.server.api.room.dto.CreateRoomResponse;
import com.meokgo.server.api.room.dto.RestoreParticipantResponse;
import com.meokgo.server.api.room.dto.RoomConditionResponse;
import com.meokgo.server.api.room.dto.RoomDetailParticipantResponse;
import com.meokgo.server.api.room.dto.RoomDetailResponse;
import com.meokgo.server.api.room.dto.RoomParticipantSummary;
import com.meokgo.server.api.room.dto.StartVoteResponse;
import com.meokgo.server.api.room.dto.TakeoverHostResponse;
import com.meokgo.server.api.room.dto.WaitingStatusResponse;
import com.meokgo.server.domain.food.service.FoodPreferenceService;
import com.meokgo.server.domain.quest.repository.RoomQuestCandidateRepository;
import com.meokgo.server.domain.region.domain.Region;
import com.meokgo.server.domain.region.domain.UserRecentRegion;
import com.meokgo.server.domain.region.repository.RegionRepository;
import com.meokgo.server.domain.region.repository.UserRecentRegionRepository;
import com.meokgo.server.domain.room.domain.ExplorationCondition;
import com.meokgo.server.domain.room.domain.ExplorationRoom;
import com.meokgo.server.domain.room.domain.InviteLink;
import com.meokgo.server.domain.room.domain.ParticipantRole;
import com.meokgo.server.domain.room.domain.ParticipantStatus;
import com.meokgo.server.domain.room.domain.RoomParticipant;
import com.meokgo.server.domain.room.repository.ExplorationConditionRepository;
import com.meokgo.server.domain.room.repository.ExplorationRoomRepository;
import com.meokgo.server.domain.room.repository.InviteLinkRepository;
import com.meokgo.server.domain.room.repository.RoomParticipantRepository;
import com.meokgo.server.domain.room.service.RoomAccessService.Context;
import com.meokgo.server.domain.user.domain.DeviceUser;
import com.meokgo.server.domain.user.repository.DeviceUserRepository;
import com.meokgo.server.domain.vote.domain.Vote;
import com.meokgo.server.domain.vote.repository.VoteItemRepository;
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
    private final FoodPreferenceService foodPreferenceService;
    private final RoomQuestCandidateRepository candidateRepository;
    private final RoomAccessService accessService;
    private final UserRecentRegionRepository recentRegionRepository;
    private final VoteItemRepository voteItemRepository;

    public RoomService(
            DeviceUserRepository deviceUserRepository,
            RegionRepository regionRepository,
            ExplorationRoomRepository roomRepository,
            ExplorationConditionRepository conditionRepository,
            InviteLinkRepository inviteLinkRepository,
            RoomParticipantRepository participantRepository,
            VoteRepository voteRepository,
            FoodPreferenceService foodPreferenceService,
            RoomQuestCandidateRepository candidateRepository,
            RoomAccessService accessService,
            UserRecentRegionRepository recentRegionRepository,
            VoteItemRepository voteItemRepository
    ) {
        this.deviceUserRepository = deviceUserRepository;
        this.regionRepository = regionRepository;
        this.roomRepository = roomRepository;
        this.conditionRepository = conditionRepository;
        this.inviteLinkRepository = inviteLinkRepository;
        this.participantRepository = participantRepository;
        this.voteRepository = voteRepository;
        this.foodPreferenceService = foodPreferenceService;
        this.candidateRepository = candidateRepository;
        this.accessService = accessService;
        this.recentRegionRepository = recentRegionRepository;
        this.voteItemRepository = voteItemRepository;
    }

    @Transactional
    public CreateRoomResponse createRoom(String deviceKey, CreateRoomRequest request) {
        FoodPreferenceResponse preference = foodPreferenceService.requireResolved(request.avoidFoods());
        DeviceUser hostUser = deviceUserRepository.findByDeviceKeyForUpdate(deviceKey)
                .orElseGet(() -> deviceUserRepository.save(DeviceUser.create(deviceKey, "호스트")));
        Region region = regionRepository.findById(request.regionId()).filter(Region::isActive)
                .orElseThrow(() -> new BusinessException(ErrorCode.REGION_NOT_FOUND));

        UserRecentRegion recent = recentRegionRepository.findFirstByUserAndRegionOrderBySelectedAtDesc(hostUser, region)
                .orElseGet(() -> recentRegionRepository.save(new UserRecentRegion(hostUser, region)));
        recent.selectAgain();
        ExplorationRoom room = roomRepository.save(ExplorationRoom.create(hostUser, region, createRoomCode()));
        conditionRepository.save(new ExplorationCondition(
                room,
                request.scheduleType(),
                request.timeSlot(),
                request.drinkingOption(),
                preference
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

    @Transactional
    public WaitingStatusResponse getWaitingStatus(String deviceKey, Long roomId) {
        Context context = accessService.access(deviceKey, roomId);
        ExplorationRoom room = context.room();
        LocalDateTime now = LocalDateTime.now();
        List<RoomParticipant> active = accessService.participants(room);
        List<RoomParticipantSummary> participants = active.stream()
                .map(value -> new RoomParticipantSummary(value.getId(), value.getNickname(), value.getRole().name(),
                        accessService.connected(value, now))).toList();
        RoomParticipant host = active.stream().filter(value -> value.getRole() == ParticipantRole.HOST)
                .findFirst().orElseThrow(() -> new BusinessException(ErrorCode.PARTICIPANT_NOT_FOUND));
        long remainingSeconds = Math.max(0, (Duration.between(now, room.getHostTakeoverAvailableAt()).toMillis() + 999) / 1000);
        boolean isHost = context.participant().getRole() == ParticipantRole.HOST;
        boolean disconnected = !accessService.connected(host, now);
        boolean expired = !room.getHostTakeoverAvailableAt().isAfter(now);
        boolean canStartVote = isHost && room.isJoinable()
                && candidateRepository.findByRoomOrderByCandidateOrderAsc(room).size() >= 3;
        return new WaitingStatusResponse(roomId, room.getStatus().name(), participants, isHost, disconnected, expired,
                room.getHostTakeoverAvailableAt(), remainingSeconds,
                !isHost && room.isActive() && disconnected && expired, canStartVote);
    }

    @Transactional
    public RestoreParticipantResponse restoreParticipant(String deviceKey, Long roomId) {
        Context context = accessService.access(deviceKey, roomId);
        context.participant().restore();
        List<Long> selected = voteRepository.findByRoom(context.room())
                .map(vote -> voteItemRepository.findByVoteAndParticipant(vote, context.participant()).stream()
                        .map(item -> item.getCandidate().getId()).sorted().toList()).orElseGet(List::of);
        RoomParticipant participant = context.participant();
        return new RestoreParticipantResponse(roomId, participant.getId(), participant.getNickname(),
                context.room().getStatus().name(), participant.getStatus().name(), true,
                participant.isVoteSubmitted(), selected);
    }

    @Transactional
    public TakeoverHostResponse takeoverHost(String deviceKey, Long roomId) {
        Context context = accessService.access(deviceKey, roomId);
        accessService.requireActive(context.room());
        if (context.participant().getRole() == ParticipantRole.HOST) {
            return new TakeoverHostResponse(roomId, context.participant().getId());
        }
        RoomParticipant previousHost = accessService.participants(context.room()).stream()
                .filter(value -> value.getRole() == ParticipantRole.HOST).findFirst()
                .orElseThrow(() -> new BusinessException(ErrorCode.PARTICIPANT_NOT_FOUND));
        LocalDateTime now = LocalDateTime.now();
        if (context.room().getHostTakeoverAvailableAt().isAfter(now) || accessService.connected(previousHost, now)) {
            throw new BusinessException(ErrorCode.ROOM_HOST_TAKEOVER_NOT_AVAILABLE);
        }
        previousHost.becomeMember();
        context.participant().becomeHost();
        context.room().changeHost(context.participant().getUser());
        return new TakeoverHostResponse(roomId, context.participant().getId());
    }

    @Transactional
    public RoomDetailResponse getDetail(String deviceKey, Long roomId) {
        Context context = accessService.access(deviceKey, roomId);
        RoomConditionResponse condition = conditionRepository.findByRoom(context.room()).map(value ->
                new RoomConditionResponse(value.getScheduleType().name(),
                        value.getTimeSlot() == null ? null : value.getTimeSlot().name(),
                        value.getDrinkingOption().name(), value.getAvoidFoods())).orElse(null);
        LocalDateTime now = LocalDateTime.now();
        return new RoomDetailResponse(roomId, context.room().getStatus().name(), context.room().getRegion().getName(),
                condition, accessService.participants(context.room()).stream().map(value ->
                        new RoomDetailParticipantResponse(value.getId(), value.getNickname(), value.getRole().name(),
                                value.getStatus().name(), accessService.connected(value, now))).toList());
    }

    @Transactional
    public StartVoteResponse startVote(String deviceKey, Long roomId) {
        Context context = accessService.access(deviceKey, roomId);
        ExplorationRoom room = context.room();
        accessService.requireHost(context.participant());
        accessService.requireActive(room);
        if (!room.isJoinable()) {
            throw new BusinessException(ErrorCode.ROOM_ALREADY_STARTED);
        }

        if (candidateRepository.findByRoomOrderByCandidateOrderAsc(room).size() < 3) {
            throw new BusinessException(ErrorCode.QUEST_CANDIDATE_NOT_READY);
        }
        room.startVote();
        participantRepository.findByRoomOrderByIdAsc(room).stream()
                .filter(participant -> participant.getStatus() != ParticipantStatus.LEFT)
                .forEach(RoomParticipant::startVoting);
        Vote vote = voteRepository.findByRoom(room)
                .orElseGet(() -> voteRepository.save(new Vote(room)));

        return new StartVoteResponse(room.getId(), room.getStatus().name(), vote.getId());
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
