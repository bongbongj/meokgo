package com.meokgo.server.domain.home.service;

import com.meokgo.server.api.home.dto.HomeResponse.ActiveRoom;
import com.meokgo.server.api.home.dto.HomeResponse.PopularRegion;
import com.meokgo.server.api.home.dto.HomeResponse.RecentRecord;
import com.meokgo.server.api.home.dto.HomeResponse;
import com.meokgo.server.domain.exploration.repository.QuestProgressRepository;
import com.meokgo.server.domain.quest.repository.FinalQuestRepository;
import com.meokgo.server.domain.record.repository.ExplorationRecordRepository;
import com.meokgo.server.domain.retention.service.RetentionService;
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
public class HomeService {
    private final DeviceUserRepository userRepository;
    private final RoomParticipantRepository participantRepository;
    private final ExplorationRecordRepository recordRepository;
    private final FinalQuestRepository finalQuestRepository;
    private final QuestProgressRepository progressRepository;
    private final RetentionService retentionService;

    public HomeService(DeviceUserRepository userRepository, RoomParticipantRepository participantRepository,
            ExplorationRecordRepository recordRepository, FinalQuestRepository finalQuestRepository,
            QuestProgressRepository progressRepository, RetentionService retentionService) {
        this.userRepository = userRepository;
        this.participantRepository = participantRepository;
        this.recordRepository = recordRepository;
        this.finalQuestRepository = finalQuestRepository;
        this.progressRepository = progressRepository;
        this.retentionService = retentionService;
    }

    @Transactional
    public HomeResponse home(String deviceKey) {
        var stages = retentionService.synchronize(deviceKey);
        DeviceUser user = userRepository.findByDeviceKey(deviceKey)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        ActiveRoom active = participantRepository.findActiveByUser(user, ParticipantStatus.LEFT,
                List.of(RoomStatus.FINISHED, RoomStatus.EXPIRED), LocalDateTime.now(), PageRequest.of(0, 1))
                .stream().findFirst().map(this::activeRoom).orElse(null);
        var recent = recordRepository.findByUserOrderByCreatedAtDescIdDesc(user, PageRequest.of(0, 3)).stream()
                .map(record -> new RecentRecord(record.getId(), record.getRegion().getName(),
                        record.getParticipantCount(), record.getCompletedQuestCount(), record.getCreatedAt(),
                        record.getRegion().getImageUrl())).toList();
        var popular = recordRepository.findPopularRegions(PageRequest.of(0, 3)).stream()
                .map(value -> new PopularRegion(value.getRegionId(), value.getRegionName(), value.getExplorationCount(),
                        value.getRegionImageUrl()))
                .toList();
        return new HomeResponse(active, recent, popular, retentionService.summary(stages));
    }

    private ActiveRoom activeRoom(RoomParticipant participant) {
        var room = participant.getRoom();
        var quests = finalQuestRepository.findByRoomOrderByRankNoAsc(room);
        long completed = quests.isEmpty() ? 0 : progressRepository.findByFinalQuestIdIn(
                quests.stream().map(quest -> quest.getId()).toList()).stream()
                .filter(value -> value.getParticipant().getId().equals(participant.getId()))
                .filter(value -> value.isCompleted()).count();
        long participants = participantRepository.findByRoomOrderByIdAsc(room).stream()
                .filter(value -> value.getStatus() != ParticipantStatus.LEFT).count();
        return new ActiveRoom(room.getId(), room.getStatus().name(), room.getRegion().getName(), participants,
                completed, quests.isEmpty() ? 3 : quests.size());
    }
}
