package com.meokgo.server.domain.vote.service;

import com.meokgo.server.api.vote.dto.CandidateVoteResult;
import com.meokgo.server.domain.quest.domain.RoomQuestCandidate;
import com.meokgo.server.domain.quest.repository.RoomQuestCandidateRepository;
import com.meokgo.server.domain.room.domain.ParticipantStatus;
import com.meokgo.server.domain.vote.domain.Vote;
import com.meokgo.server.domain.vote.repository.VoteItemRepository;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class VoteResultService {

    public record ScoredCandidate(RoomQuestCandidate candidate, long voteCount) {
        public CandidateVoteResult response() {
            return new CandidateVoteResult(candidate.getId(), candidate.getQuest().getTitle(), voteCount);
        }
    }

    private final RoomQuestCandidateRepository candidateRepository;
    private final VoteItemRepository voteItemRepository;

    public VoteResultService(RoomQuestCandidateRepository candidateRepository,
            VoteItemRepository voteItemRepository) {
        this.candidateRepository = candidateRepository;
        this.voteItemRepository = voteItemRepository;
    }

    public List<ScoredCandidate> ranked(Vote vote) {
        Map<Long, Long> counts = new HashMap<>();
        voteItemRepository.countCandidates(vote, ParticipantStatus.LEFT)
                .forEach(count -> counts.put(count.getCandidateId(), count.getVoteCount()));
        return candidateRepository.findByRoomOrderByCandidateOrderAsc(vote.getRoom()).stream()
                .map(candidate -> new ScoredCandidate(candidate, counts.getOrDefault(candidate.getId(), 0L)))
                .sorted(Comparator.comparingLong(ScoredCandidate::voteCount).reversed()
                        .thenComparingInt(value -> value.candidate().getCandidateOrder()))
                .toList();
    }
}
