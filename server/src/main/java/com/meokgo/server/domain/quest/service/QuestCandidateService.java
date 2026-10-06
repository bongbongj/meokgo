package com.meokgo.server.domain.quest.service;

import com.meokgo.server.api.quest.dto.CreateQuestCandidatesResponse;
import com.meokgo.server.api.quest.dto.QuestCandidateItemResponse;
import com.meokgo.server.api.quest.dto.QuestCandidateListResponse;
import com.meokgo.server.domain.quest.domain.Quest;
import com.meokgo.server.domain.quest.domain.RoomQuestCandidate;
import com.meokgo.server.domain.quest.repository.QuestRepository;
import com.meokgo.server.domain.quest.repository.RoomQuestCandidateRepository;
import com.meokgo.server.domain.room.domain.ExplorationRoom;
import com.meokgo.server.domain.room.domain.RoomParticipant;
import com.meokgo.server.domain.room.repository.ExplorationRoomRepository;
import com.meokgo.server.domain.room.repository.RoomParticipantRepository;
import com.meokgo.server.domain.user.domain.DeviceUser;
import com.meokgo.server.domain.user.repository.DeviceUserRepository;
import com.meokgo.server.domain.vote.domain.Vote;
import com.meokgo.server.domain.vote.domain.VoteItem;
import com.meokgo.server.domain.vote.repository.VoteItemRepository;
import com.meokgo.server.domain.vote.repository.VoteRepository;
import com.meokgo.server.global.error.BusinessException;
import com.meokgo.server.global.error.ErrorCode;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class QuestCandidateService {

    private final ExplorationRoomRepository roomRepository;
    private final QuestRepository questRepository;
    private final RoomQuestCandidateRepository candidateRepository;
    private final DeviceUserRepository deviceUserRepository;
    private final RoomParticipantRepository participantRepository;
    private final VoteRepository voteRepository;
    private final VoteItemRepository voteItemRepository;

    public QuestCandidateService(
            ExplorationRoomRepository roomRepository,
            QuestRepository questRepository,
            RoomQuestCandidateRepository candidateRepository,
            DeviceUserRepository deviceUserRepository,
            RoomParticipantRepository participantRepository,
            VoteRepository voteRepository,
            VoteItemRepository voteItemRepository
    ) {
        this.roomRepository = roomRepository;
        this.questRepository = questRepository;
        this.candidateRepository = candidateRepository;
        this.deviceUserRepository = deviceUserRepository;
        this.participantRepository = participantRepository;
        this.voteRepository = voteRepository;
        this.voteItemRepository = voteItemRepository;
    }

    @Transactional
    public CreateQuestCandidatesResponse createCandidates(Long roomId) {
        ExplorationRoom room = findRoom(roomId);
        if (!candidateRepository.existsByRoom(room)) {
            List<Quest> quests = questRepository.findTop6ByActiveTrueOrderByIdAsc();
            if (quests.size() < 3) {
                throw new BusinessException(ErrorCode.QUEST_CANDIDATE_INSUFFICIENT);
            }
            int order = 1;
            for (Quest quest : quests) {
                candidateRepository.save(new RoomQuestCandidate(room, quest, order, "초기 MVP 후보 퀘스트"));
                order++;
            }
        }

        List<RoomQuestCandidate> candidates = candidateRepository.findByRoomOrderByCandidateOrderAsc(room);
        return new CreateQuestCandidatesResponse(
                room.getId(),
                candidates.size(),
                candidates.size() < 6,
                candidates.size() < 3,
                toItems(candidates, Set.of(), null)
        );
    }

    @Transactional(readOnly = true)
    public QuestCandidateListResponse getCandidates(String deviceKey, Long roomId) {
        ExplorationRoom room = findRoom(roomId);
        List<RoomQuestCandidate> candidates = candidateRepository.findByRoomOrderByCandidateOrderAsc(room);
        if (candidates.isEmpty()) {
            throw new BusinessException(ErrorCode.QUEST_CANDIDATE_NOT_READY);
        }

        Vote vote = voteRepository.findByRoom(room).orElse(null);
        Set<Long> selectedCandidateIds = selectedCandidateIds(deviceKey, room, vote);

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

    private Set<Long> selectedCandidateIds(String deviceKey, ExplorationRoom room, Vote vote) {
        if (vote == null) {
            return Set.of();
        }
        return deviceUserRepository.findByDeviceKey(deviceKey)
                .flatMap(user -> participantRepository.findByRoomAndUser(room, user))
                .map(participant -> voteItemRepository.findByVoteAndParticipant(vote, participant)
                        .stream()
                        .map(VoteItem::getCandidate)
                        .map(RoomQuestCandidate::getId)
                        .collect(Collectors.toSet()))
                .orElse(Set.of());
    }

    private ExplorationRoom findRoom(Long roomId) {
        return roomRepository.findById(roomId)
                .orElseThrow(() -> new BusinessException(ErrorCode.ROOM_NOT_FOUND));
    }
}
