package com.meokgo.server.domain.exploration.service;

import com.meokgo.server.api.exploration.dto.ExplorationProgressResponse;
import com.meokgo.server.api.exploration.dto.ExplorationQuestResponse;
import com.meokgo.server.api.exploration.dto.FinishExplorationResponse;
import com.meokgo.server.api.exploration.dto.StartExplorationResponse;
import com.meokgo.server.api.exploration.dto.UpdateQuestProgressResponse;
import com.meokgo.server.domain.exploration.domain.QuestProgress;
import com.meokgo.server.domain.exploration.repository.QuestProgressRepository;
import com.meokgo.server.domain.quest.domain.FinalQuest;
import com.meokgo.server.domain.quest.domain.UserQuestHistory;
import com.meokgo.server.domain.quest.repository.FinalQuestRepository;
import com.meokgo.server.domain.quest.repository.UserQuestHistoryRepository;
import com.meokgo.server.domain.record.domain.ExplorationRecord;
import com.meokgo.server.domain.record.repository.ExplorationRecordRepository;
import com.meokgo.server.domain.retention.service.RetentionService;
import com.meokgo.server.domain.room.domain.ExplorationRoom;
import com.meokgo.server.domain.room.domain.ParticipantRole;
import com.meokgo.server.domain.room.domain.RoomParticipant;
import com.meokgo.server.domain.room.domain.RoomStatus;
import com.meokgo.server.domain.room.service.RoomAccessService.Context;
import com.meokgo.server.domain.room.service.RoomAccessService;
import com.meokgo.server.global.error.BusinessException;
import com.meokgo.server.global.error.ErrorCode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 참여자 본인의 완료 상태를 집계하고 탐험 종료 시 기록과 완료 이력을 함께 저장한다.
 * 상태 변경은 방 잠금으로 직렬화하여 종료와 완료 요청의 충돌 및 재요청 중복을 방지한다.
 *
 * @author 정효림
 */
@Service
public class ExplorationService {

    private final RetentionService retentionService;
    private final RoomAccessService accessService;
    private final FinalQuestRepository finalQuestRepository;
    private final QuestProgressRepository progressRepository;
    private final ExplorationRecordRepository recordRepository;
    private final UserQuestHistoryRepository historyRepository;

    public ExplorationService(RoomAccessService accessService, FinalQuestRepository finalQuestRepository,
            QuestProgressRepository progressRepository, ExplorationRecordRepository recordRepository,
            UserQuestHistoryRepository historyRepository, RetentionService retentionService) {
        this.retentionService = retentionService;
        this.accessService = accessService;
        this.finalQuestRepository = finalQuestRepository;
        this.progressRepository = progressRepository;
        this.recordRepository = recordRepository;
        this.historyRepository = historyRepository;
    }

    @Transactional
    public StartExplorationResponse start(String deviceKey, Long roomId) {
        Context context = accessService.access(deviceKey, roomId);
        requireHost(context);
        requireNotExpired(context.room());
        if (context.room().getStatus() == RoomStatus.IN_PROGRESS) {
            return new StartExplorationResponse(roomId, context.room().getStatus().name());
        }
        requireStatus(context.room(), RoomStatus.QUEST_CONFIRMED);
        List<FinalQuest> quests = finalQuestRepository.findByRoomOrderByRankNoAsc(context.room());
        if (quests.size() != 3) {
            throw new BusinessException(ErrorCode.QUEST_CANDIDATE_NOT_READY, "확정 퀘스트 3개가 필요합니다.");
        }
        List<RoomParticipant> participants = activeParticipants(context.room());
        List<QuestProgress> progress = new ArrayList<>();
        for (RoomParticipant participant : participants) {
            for (FinalQuest quest : quests) {
                progress.add(new QuestProgress(quest, participant));
            }
            participant.startExploration();
        }
        progressRepository.saveAll(progress);
        context.room().startExploration();
        return new StartExplorationResponse(roomId, context.room().getStatus().name());
    }

    @Transactional
    public ExplorationProgressResponse progress(String deviceKey, Long roomId) {
        Context context = accessService.access(deviceKey, roomId);
        if (context.room().getStatus() != RoomStatus.FINISHED) {
            requireNotExpired(context.room());
            requireStatus(context.room(), RoomStatus.IN_PROGRESS);
        }
        List<FinalQuest> quests = finalQuestRepository.findByRoomOrderByRankNoAsc(context.room());
        List<RoomParticipant> participants = activeParticipants(context.room());
        Set<Long> participantIds = participants.stream().map(RoomParticipant::getId).collect(Collectors.toSet());
        List<QuestProgress> completed = progressFor(quests).stream()
                .filter(QuestProgress::isCompleted)
                .filter(value -> participantIds.contains(value.getParticipant().getId())).toList();
        Set<Long> ownCompleted = completed.stream()
                .filter(value -> value.getParticipant().getId().equals(context.participant().getId()))
                .map(value -> value.getFinalQuest().getId()).collect(Collectors.toSet());
        Map<Long, Long> counts = completed.stream().collect(Collectors.groupingBy(
                value -> value.getFinalQuest().getId(), Collectors.counting()));
        List<ExplorationQuestResponse> items = quests.stream().map(quest -> new ExplorationQuestResponse(
                quest.getId(), quest.getCandidate().getQuest().getTitle(), ownCompleted.contains(quest.getId()),
                counts.getOrDefault(quest.getId(), 0L))).toList();
        int rate = quests.isEmpty() ? 0 : ownCompleted.size() * 100 / quests.size();
        return new ExplorationProgressResponse(roomId, context.room().getRegion().getName(), participants.size(),
                quests.size(), ownCompleted.size(), rate, items);
    }

    @Transactional
    public UpdateQuestProgressResponse update(String deviceKey, Long roomId, Long finalQuestId, boolean completed) {
        Context context = accessService.access(deviceKey, roomId);
        requireNotExpired(context.room());
        requireStatus(context.room(), RoomStatus.IN_PROGRESS);
        List<FinalQuest> quests = finalQuestRepository.findByRoomOrderByRankNoAsc(context.room());
        if (quests.stream().noneMatch(quest -> quest.getId().equals(finalQuestId))) {
            throw new BusinessException(ErrorCode.QUEST_NOT_FOUND);
        }
        QuestProgress progress = progressFor(quests).stream()
                .filter(value -> value.getFinalQuest().getId().equals(finalQuestId))
                .filter(value -> value.getParticipant().getId().equals(context.participant().getId()))
                .findFirst().orElseThrow(() -> new BusinessException(ErrorCode.QUEST_NOT_FOUND));
        progress.changeCompletion(completed);
        return new UpdateQuestProgressResponse(finalQuestId, progress.isCompleted(), progress.getCompletedAt(),
                false, false, false);
    }

    @Transactional
    public FinishExplorationResponse finish(String deviceKey, Long roomId) {
        Context context = accessService.access(deviceKey, roomId);
        requireHost(context);
        if (context.room().getStatus() == RoomStatus.FINISHED) {
            return finishResponse(context);
        }
        requireNotExpired(context.room());
        requireStatus(context.room(), RoomStatus.IN_PROGRESS);
        List<RoomParticipant> participants = activeParticipants(context.room());
        Set<Long> participantIds = participants.stream().map(RoomParticipant::getId).collect(Collectors.toSet());
        List<QuestProgress> completed = progressFor(finalQuestRepository.findByRoomOrderByRankNoAsc(context.room()))
                .stream().filter(QuestProgress::isCompleted)
                .filter(value -> participantIds.contains(value.getParticipant().getId())).toList();
        Map<Long, List<QuestProgress>> byParticipant = completed.stream()
                .collect(Collectors.groupingBy(value -> value.getParticipant().getId()));
        List<ExplorationRecord> records = new ArrayList<>();
        for (RoomParticipant participant : participants) {
            records.add(new ExplorationRecord(context.room(), participant.getUser(), participants.size(),
                    byParticipant.getOrDefault(participant.getId(), List.of()).size()));
            participant.finishExploration();
        }
        recordRepository.saveAll(records);
        historyRepository.saveAll(completed.stream().map(value -> new UserQuestHistory(
                value.getParticipant().getUser(), value.getFinalQuest().getCandidate().getQuest(),
                context.room(), value.getCompletedAt())).toList());
        context.room().finishExploration();
        participants.stream().sorted(Comparator.comparing(value -> value.getUser().getId()))
                .forEach(value -> retentionService.synchronize(value.getUser().getDeviceKey()));
        return finishResponse(context);
    }

    private FinishExplorationResponse finishResponse(Context context) {
        ExplorationRecord record = recordRepository.findByRoomAndUser(context.room(), context.participant().getUser())
                .orElseThrow(() -> new BusinessException(ErrorCode.RECORD_NOT_FOUND));
        return new FinishExplorationResponse(context.room().getId(), context.room().getStatus().name(), record.getId(), true);
    }

    private List<RoomParticipant> activeParticipants(ExplorationRoom room) {
        return accessService.participants(room);
    }

    private List<QuestProgress> progressFor(List<FinalQuest> quests) {
        return quests.isEmpty() ? List.of()
                : progressRepository.findByFinalQuestIdIn(quests.stream().map(FinalQuest::getId).toList());
    }

    private void requireHost(Context context) {
        if (context.participant().getRole() != ParticipantRole.HOST) {
            throw new BusinessException(ErrorCode.ROOM_FORBIDDEN);
        }
    }

    private void requireNotExpired(ExplorationRoom room) {
        if (!room.getExpiredAt().isAfter(LocalDateTime.now())) {
            throw new BusinessException(ErrorCode.ROOM_CLOSED, "만료된 탐험방입니다.");
        }
    }

    private void requireStatus(ExplorationRoom room, RoomStatus status) {
        if (room.getStatus() != status) {
            throw new BusinessException(ErrorCode.ROOM_CLOSED, "현재 탐험방 상태에서는 요청을 처리할 수 없습니다.");
        }
    }
}
