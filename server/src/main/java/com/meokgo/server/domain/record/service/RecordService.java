package com.meokgo.server.domain.record.service;

import com.meokgo.server.api.record.dto.RecordDetailResponse;
import com.meokgo.server.api.record.dto.RecordListItemResponse;
import com.meokgo.server.api.record.dto.RecordListResponse;
import com.meokgo.server.api.record.dto.RecordPhotoResponse;
import com.meokgo.server.api.record.dto.RecordQuestResponse;
import com.meokgo.server.domain.exploration.domain.QuestProgress;
import com.meokgo.server.domain.exploration.repository.QuestProgressRepository;
import com.meokgo.server.domain.quest.domain.FinalQuest;
import com.meokgo.server.domain.quest.repository.FinalQuestRepository;
import com.meokgo.server.domain.record.domain.ExplorationRecord;
import com.meokgo.server.domain.record.repository.ExplorationRecordRepository;
import com.meokgo.server.domain.room.domain.ParticipantStatus;
import com.meokgo.server.domain.room.domain.RoomParticipant;
import com.meokgo.server.domain.room.repository.RoomParticipantRepository;
import com.meokgo.server.domain.story.repository.RecordPhotoRepository;
import com.meokgo.server.domain.user.domain.DeviceUser;
import com.meokgo.server.domain.user.repository.DeviceUserRepository;
import com.meokgo.server.global.error.BusinessException;
import com.meokgo.server.global.error.ErrorCode;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Slice;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class RecordService {

    private final RecordPhotoRepository photoRepository;
    private final DeviceUserRepository userRepository;
    private final ExplorationRecordRepository recordRepository;
    private final RoomParticipantRepository participantRepository;
    private final FinalQuestRepository finalQuestRepository;
    private final QuestProgressRepository progressRepository;

    public RecordService(DeviceUserRepository userRepository, ExplorationRecordRepository recordRepository,
            RoomParticipantRepository participantRepository, FinalQuestRepository finalQuestRepository,
            QuestProgressRepository progressRepository, RecordPhotoRepository photoRepository) {
        this.photoRepository = photoRepository;
        this.userRepository = userRepository;
        this.recordRepository = recordRepository;
        this.participantRepository = participantRepository;
        this.finalQuestRepository = finalQuestRepository;
        this.progressRepository = progressRepository;
    }

    public RecordListResponse list(String deviceKey, int page, int size) {
        if (page < 0 || size < 1 || size > 100) {
            throw new BusinessException(ErrorCode.COMMON_INVALID_REQUEST, "페이지는 0 이상, 크기는 1~100이어야 합니다.");
        }
        Slice<ExplorationRecord> records = recordRepository.findByUserOrderByCreatedAtDescIdDesc(
                user(deviceKey), PageRequest.of(page, size));
        return new RecordListResponse(records.stream().map(value -> new RecordListItemResponse(value.getId(),
                value.getRegion().getName(), value.getParticipantCount(), value.getCompletedQuestCount(),
                value.getCreatedAt())).toList(), records.hasNext());
    }

    public RecordDetailResponse detail(String deviceKey, Long recordId) {
        ExplorationRecord record = recordRepository.findByIdAndUser(recordId, user(deviceKey))
                .orElseThrow(() -> new BusinessException(ErrorCode.RECORD_NOT_FOUND));
        List<FinalQuest> quests = finalQuestRepository.findByRoomOrderByRankNoAsc(record.getRoom());
        List<QuestProgress> progress = quests.isEmpty() ? List.of()
                : progressRepository.findByFinalQuestIdIn(quests.stream().map(FinalQuest::getId).toList());
        List<RecordQuestResponse> completed = progress.stream()
                .filter(value -> value.getParticipant().getUser().getId().equals(record.getUser().getId()))
                .filter(QuestProgress::isCompleted)
                .sorted(Comparator.comparingInt(value -> value.getFinalQuest().getRankNo()))
                .map(value -> new RecordQuestResponse(value.getFinalQuest().getCandidate().getQuest().getTitle(), true))
                .toList();
        return new RecordDetailResponse(recordId, record.getRegion().getName(), record.getCreatedAt(),
                participantRepository.findByRoomOrderByIdAsc(record.getRoom()).stream()
                        .filter(value -> value.getStatus() != ParticipantStatus.LEFT)
                        .map(RoomParticipant::getNickname).toList(), completed,
                photoRepository.findByRecordAndDeletedFalseAndExpiredAtAfterOrderByPhotoOrderAsc(record, LocalDateTime.now())
                        .stream().map(photo -> new RecordPhotoResponse(photo.getId(), photo.getPhotoUrl())).toList());
    }

    private DeviceUser user(String deviceKey) {
        return userRepository.findByDeviceKey(deviceKey)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
    }
}
