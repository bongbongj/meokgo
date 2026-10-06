package com.meokgo.server.domain.vote.service;

import com.meokgo.server.api.vote.dto.VoteResponse;
import com.meokgo.server.domain.quest.domain.RoomQuestCandidate;
import com.meokgo.server.domain.quest.repository.RoomQuestCandidateRepository;
import com.meokgo.server.domain.room.domain.ExplorationRoom;
import com.meokgo.server.domain.room.domain.RoomParticipant;
import com.meokgo.server.domain.room.repository.ExplorationRoomRepository;
import com.meokgo.server.domain.room.repository.RoomParticipantRepository;
import com.meokgo.server.domain.user.domain.DeviceUser;
import com.meokgo.server.domain.user.repository.DeviceUserRepository;
import com.meokgo.server.domain.vote.domain.Vote;
import com.meokgo.server.domain.vote.domain.VoteItem;
import com.meokgo.server.domain.vote.domain.VoteStatus;
import com.meokgo.server.domain.vote.repository.VoteItemRepository;
import com.meokgo.server.domain.vote.repository.VoteRepository;
import com.meokgo.server.global.error.BusinessException;
import com.meokgo.server.global.error.ErrorCode;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class VoteService {

    private final ExplorationRoomRepository roomRepository;
    private final DeviceUserRepository deviceUserRepository;
    private final RoomParticipantRepository participantRepository;
    private final VoteRepository voteRepository;
    private final RoomQuestCandidateRepository candidateRepository;
    private final VoteItemRepository voteItemRepository;

    public VoteService(
            ExplorationRoomRepository roomRepository,
            DeviceUserRepository deviceUserRepository,
            RoomParticipantRepository participantRepository,
            VoteRepository voteRepository,
            RoomQuestCandidateRepository candidateRepository,
            VoteItemRepository voteItemRepository
    ) {
        this.roomRepository = roomRepository;
        this.deviceUserRepository = deviceUserRepository;
        this.participantRepository = participantRepository;
        this.voteRepository = voteRepository;
        this.candidateRepository = candidateRepository;
        this.voteItemRepository = voteItemRepository;
    }

    @Transactional
    public VoteResponse saveVote(String deviceKey, Long roomId, List<Long> candidateIds) {
        ExplorationRoom room = roomRepository.findById(roomId)
                .orElseThrow(() -> new BusinessException(ErrorCode.ROOM_NOT_FOUND));
        DeviceUser user = deviceUserRepository.findByDeviceKey(deviceKey)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        RoomParticipant participant = participantRepository.findByRoomAndUser(room, user)
                .orElseThrow(() -> new BusinessException(ErrorCode.PARTICIPANT_NOT_FOUND));
        Vote vote = voteRepository.findByRoom(room)
                .orElseThrow(() -> new BusinessException(ErrorCode.QUEST_CANDIDATE_NOT_READY));

        if (vote.getStatus() != VoteStatus.OPEN) {
            throw new BusinessException(ErrorCode.VOTE_ALREADY_CLOSED);
        }

        Set<Long> uniqueCandidateIds = new LinkedHashSet<>(candidateIds);
        if (uniqueCandidateIds.size() < vote.getMinSelectCount() || uniqueCandidateIds.size() > vote.getMaxSelectCount()) {
            throw new BusinessException(ErrorCode.VOTE_SELECTION_INVALID);
        }

        List<RoomQuestCandidate> candidates = candidateRepository.findByRoomAndIdIn(room, uniqueCandidateIds);
        if (candidates.size() != uniqueCandidateIds.size()) {
            throw new BusinessException(ErrorCode.VOTE_SELECTION_INVALID);
        }

        voteItemRepository.deleteByVoteAndParticipant(vote, participant);
        candidates.forEach(candidate -> voteItemRepository.save(new VoteItem(vote, participant, candidate)));
        participant.submitVote();

        return new VoteResponse(room.getId(), true, List.copyOf(uniqueCandidateIds));
    }
}
