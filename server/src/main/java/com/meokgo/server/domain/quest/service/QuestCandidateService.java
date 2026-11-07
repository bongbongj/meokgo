package com.meokgo.server.domain.quest.service;

import com.meokgo.server.api.quest.dto.CreateQuestCandidatesResponse;
import com.meokgo.server.api.quest.dto.QuestCandidateItemResponse;
import com.meokgo.server.api.quest.dto.QuestCandidateListResponse;
import com.meokgo.server.domain.food.service.FoodDictionary;
import com.meokgo.server.domain.quest.domain.Quest;
import com.meokgo.server.domain.quest.domain.RoomQuestCandidate;
import com.meokgo.server.domain.quest.repository.QuestRepository;
import com.meokgo.server.domain.quest.repository.RoomQuestCandidateRepository;
import com.meokgo.server.domain.quest.repository.UserQuestHistoryRepository;
import com.meokgo.server.domain.room.domain.DrinkingOption;
import com.meokgo.server.domain.room.domain.ExplorationCondition;
import com.meokgo.server.domain.room.domain.ExplorationRoom;
import com.meokgo.server.domain.room.domain.ParticipantStatus;
import com.meokgo.server.domain.room.domain.RoomParticipant;
import com.meokgo.server.domain.room.domain.RoomStatus;
import com.meokgo.server.domain.room.domain.TimeSlot;
import com.meokgo.server.domain.room.repository.ExplorationConditionRepository;
import com.meokgo.server.domain.room.repository.RoomParticipantRepository;
import com.meokgo.server.domain.room.service.RoomAccessService;
import com.meokgo.server.domain.vote.domain.Vote;
import com.meokgo.server.domain.vote.domain.VoteItem;
import com.meokgo.server.domain.vote.repository.VoteItemRepository;
import com.meokgo.server.domain.vote.repository.VoteRepository;
import com.meokgo.server.global.error.BusinessException;
import com.meokgo.server.global.error.ErrorCode;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class QuestCandidateService {

    private final QuestRepository questRepository;
    private final RoomQuestCandidateRepository candidateRepository;
    private final RoomAccessService accessService;
    private final RoomParticipantRepository participantRepository;
    private final VoteRepository voteRepository;
    private final VoteItemRepository voteItemRepository;
    private final ExplorationConditionRepository conditionRepository;
    private final UserQuestHistoryRepository historyRepository;
    private final FoodDictionary foodDictionary;

    public QuestCandidateService(
            QuestRepository questRepository,
            RoomQuestCandidateRepository candidateRepository,
            RoomAccessService accessService,
            RoomParticipantRepository participantRepository,
            VoteRepository voteRepository,
            VoteItemRepository voteItemRepository,
            ExplorationConditionRepository conditionRepository,
            UserQuestHistoryRepository historyRepository,
            FoodDictionary foodDictionary
    ) {
        this.questRepository = questRepository;
        this.candidateRepository = candidateRepository;
        this.accessService = accessService;
        this.participantRepository = participantRepository;
        this.voteRepository = voteRepository;
        this.voteItemRepository = voteItemRepository;
        this.conditionRepository = conditionRepository;
        this.historyRepository = historyRepository;
        this.foodDictionary = foodDictionary;
    }

    @Transactional
    public CreateQuestCandidatesResponse createCandidates(String deviceKey, Long roomId) {
        RoomAccessService.Context context = accessService.access(deviceKey, roomId);
        ExplorationRoom room = context.room();
        accessService.requireHost(context.participant());
        accessService.requireActive(room);
        if (!candidateRepository.existsByRoom(room)) {
            if (room.getStatus() != RoomStatus.WAITING && room.getStatus() != RoomStatus.VOTING) {
                throw new BusinessException(ErrorCode.ROOM_ALREADY_STARTED);
            }
            ExplorationCondition condition = conditionRepository.findByRoom(room)
                    .orElseThrow(() -> new BusinessException(ErrorCode.COMMON_INVALID_REQUEST));
            Set<String> avoided = foodDictionary.expand(condition.getRecognizedAvoidKeywords());
            List<Quest> quests = questRepository.findByActiveTrueAndScheduleType(condition.getScheduleType())
                    .stream().filter(quest -> matches(quest, condition, avoided)).toList();
            if (quests.size() < 3) {
                throw new BusinessException(ErrorCode.QUEST_CANDIDATE_INSUFFICIENT);
            }
            List<Long> userIds = participantRepository.findByRoomOrderByIdAsc(room).stream()
                    .filter(participant -> participant.getStatus() != ParticipantStatus.LEFT)
                    .map(participant -> participant.getUser().getId()).distinct().toList();
            Map<Long, Integer> counts = new HashMap<>();
            historyRepository.countCompletedParticipants(userIds, quests.stream().map(Quest::getId).toList())
                    .forEach(count -> counts.put(count.getQuestId(), (int) count.getCompletedParticipantCount()));
            Map<Integer, List<Quest>> groups = new TreeMap<>();
            quests.forEach(quest -> groups.computeIfAbsent(counts.getOrDefault(quest.getId(), 0),
                    ignored -> new ArrayList<>()).add(quest));
            int order = 1;
            for (Map.Entry<Integer, List<Quest>> group : groups.entrySet()) {
                Collections.shuffle(group.getValue());
                for (Quest quest : group.getValue()) {
                    if (order > 6) {
                        break;
                    }
                    candidateRepository.save(new RoomQuestCandidate(room, quest, order++,
                            "조건 일치, 현재 참여자 중 완료 경험자 " + group.getKey() + "명", group.getKey()));
                }
                if (order > 6) {
                    break;
                }
            }
        }
        room.touchHostAction();
        List<RoomQuestCandidate> candidates = candidateRepository.findByRoomOrderByCandidateOrderAsc(room);
        return new CreateQuestCandidatesResponse(room.getId(), candidates.size(),
                candidates.stream().anyMatch(candidate -> candidate.getCompletedParticipantCount() > 0),
                false, toItems(candidates, Set.of(), null));
    }

    private boolean matches(Quest quest, ExplorationCondition condition, Set<String> avoided) {
        TimeSlot requestedTime = condition.getTimeSlot();
        boolean timeMatches = requestedTime == null || requestedTime == TimeSlot.ANY
                || quest.getTimeSlot() == null || quest.getTimeSlot() == TimeSlot.ANY
                || requestedTime == quest.getTimeSlot();
        boolean drinkingMatches = condition.getDrinkingOption() != DrinkingOption.NONE
                || quest.getDrinkingOption() != DrinkingOption.AVAILABLE;
        Set<String> required = foodDictionary.expand(quest.getExcludedKeywords());
        return timeMatches && drinkingMatches && Collections.disjoint(avoided, required);
    }

    @Transactional
    public QuestCandidateListResponse getCandidates(String deviceKey, Long roomId) {
        RoomAccessService.Context context = accessService.access(deviceKey, roomId);
        ExplorationRoom room = context.room();
        List<RoomQuestCandidate> candidates = candidateRepository.findByRoomOrderByCandidateOrderAsc(room);
        if (candidates.isEmpty()) {
            throw new BusinessException(ErrorCode.QUEST_CANDIDATE_NOT_READY);
        }

        Vote vote = voteRepository.findByRoom(room).orElse(null);
        Set<Long> selectedCandidateIds = selectedCandidateIds(context.participant(), vote);

        return new QuestCandidateListResponse(
                candidates.size(),
                candidates.size() < 3,
                1,
                3,
                toItems(candidates, selectedCandidateIds, vote)
        );
    }

    private List<QuestCandidateItemResponse> toItems(
            List<RoomQuestCandidate> candidates,
            Set<Long> selectedCandidateIds,
            Vote vote
    ) {
        return candidates.stream()
                .map(candidate -> new QuestCandidateItemResponse(
                        candidate.getId(),
                        candidate.getQuest().getId(),
                        candidate.getQuest().getTitle(),
                        candidate.getQuest().getDescription(),
                        candidate.getQuest().getType().name(),
                        candidate.getSelectedReason(),
                        candidate.getCandidateOrder(),
                        selectedCandidateIds.contains(candidate.getId()),
                        vote == null ? 0 : voteItemRepository.countByVoteAndCandidateId(vote, candidate.getId())
                ))
                .toList();
    }

    private Set<Long> selectedCandidateIds(RoomParticipant participant, Vote vote) {
        return vote == null ? Set.of() : voteItemRepository.findByVoteAndParticipant(vote, participant).stream()
                .map(VoteItem::getCandidate).map(RoomQuestCandidate::getId).collect(Collectors.toSet());
    }
}
