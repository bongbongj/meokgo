package com.meokgo.server.domain.vote.service;

import com.meokgo.server.api.vote.dto.CloseVotePreviewResponse;
import com.meokgo.server.api.vote.dto.CloseVoteResponse;
import com.meokgo.server.api.vote.dto.VoteParticipantResponse;
import com.meokgo.server.api.vote.dto.VoteResponse;
import com.meokgo.server.api.vote.dto.VoteStatusResponse;
import com.meokgo.server.domain.quest.domain.RoomQuestCandidate;
import com.meokgo.server.domain.quest.repository.RoomQuestCandidateRepository;
import com.meokgo.server.domain.room.domain.RoomParticipant;
import com.meokgo.server.domain.room.domain.RoomStatus;
import com.meokgo.server.domain.vote.domain.Vote;
import com.meokgo.server.domain.vote.domain.VoteItem;
import com.meokgo.server.domain.vote.domain.VoteStatus;
import com.meokgo.server.domain.vote.repository.VoteItemRepository;
import com.meokgo.server.domain.vote.service.VoteAccessService.Context;
import com.meokgo.server.domain.vote.service.VoteResultService.ScoredCandidate;
import com.meokgo.server.global.error.BusinessException;
import com.meokgo.server.global.error.ErrorCode;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class VoteService {

    private final VoteAccessService accessService;
    private final RoomQuestCandidateRepository candidateRepository;
    private final VoteItemRepository voteItemRepository;
    private final VoteResultService resultService;

    public VoteService(VoteAccessService accessService, RoomQuestCandidateRepository candidateRepository,
            VoteItemRepository voteItemRepository, VoteResultService resultService) {
        this.accessService = accessService;
        this.candidateRepository = candidateRepository;
        this.voteItemRepository = voteItemRepository;
        this.resultService = resultService;
    }

    @Transactional
    public VoteResponse saveVote(String deviceKey, Long roomId, List<Long> candidateIds) {
        Context context = accessService.lock(deviceKey, roomId);
        requireOpen(context);
        Vote vote = context.vote();
        Set<Long> uniqueIds = new LinkedHashSet<>(candidateIds);
        if (uniqueIds.size() != candidateIds.size() || uniqueIds.contains(null)
                || uniqueIds.size() < vote.getMinSelectCount() || uniqueIds.size() > vote.getMaxSelectCount()) {
            throw new BusinessException(ErrorCode.VOTE_SELECTION_INVALID);
        }
        List<RoomQuestCandidate> candidates = candidateRepository.findByRoomAndIdIn(context.room(), uniqueIds);
        if (candidates.size() != uniqueIds.size()) {
            throw new BusinessException(ErrorCode.VOTE_SELECTION_INVALID);
        }
        List<VoteItem> previous = voteItemRepository.findByVoteAndParticipant(vote, context.participant());
        Set<Long> existing = previous.stream().map(item -> item.getCandidate().getId()).collect(Collectors.toSet());
        voteItemRepository.deleteAll(previous.stream()
                .filter(item -> !uniqueIds.contains(item.getCandidate().getId())).toList());
        previous.stream().filter(item -> uniqueIds.contains(item.getCandidate().getId())).forEach(VoteItem::touch);
        candidates.stream().filter(candidate -> !existing.contains(candidate.getId()))
                .forEach(candidate -> voteItemRepository.save(new VoteItem(vote, context.participant(), candidate)));
        context.participant().submitVote();
        return new VoteResponse(roomId, true, List.copyOf(uniqueIds));
    }

    @Transactional
    public VoteStatusResponse getStatus(String deviceKey, Long roomId) {
        Context context = accessService.read(deviceKey, roomId);
        List<RoomParticipant> participants = accessService.activeParticipants(context.room());
        int voted = (int) participants.stream().filter(RoomParticipant::isVoteSubmitted).count();
        return new VoteStatusResponse(participants.size(), voted,
                voteItemRepository.findByVoteAndParticipant(context.vote(), context.participant()).size(),
                context.vote().getMaxSelectCount(), participants.size() + "명 중 " + voted + "명 투표 완료", false,
                participants.stream().map(participant -> new VoteParticipantResponse(participant.getId(),
                        participant.getNickname(), participant.isVoteSubmitted())).toList(),
                resultService.ranked(context.vote()).stream().map(ScoredCandidate::response).toList());
    }

    @Transactional
    public CloseVotePreviewResponse previewClose(String deviceKey, Long roomId) {
        Context context = accessService.read(deviceKey, roomId);
        accessService.requireHost(context);
        requireOpen(context);
        return new CloseVotePreviewResponse(notVotedCount(context), true, false,
                resultService.ranked(context.vote()).stream().limit(3).map(ScoredCandidate::response).toList());
    }

    @Transactional
    public CloseVoteResponse close(String deviceKey, Long roomId, Boolean confirmed) {
        Context context = accessService.lock(deviceKey, roomId);
        accessService.requireHost(context);
        requireOpen(context);
        if (!Boolean.TRUE.equals(confirmed)) {
            throw new BusinessException(ErrorCode.VOTE_CLOSE_CONFIRM_REQUIRED);
        }
        int notVoted = notVotedCount(context);
        context.vote().close(notVoted);
        context.room().closeVote();
        return new CloseVoteResponse(roomId, context.room().getStatus().name(), notVoted, false);
    }

    private int notVotedCount(Context context) {
        return (int) accessService.activeParticipants(context.room()).stream()
                .filter(participant -> !participant.isVoteSubmitted()).count();
    }

    private void requireOpen(Context context) {
        if (context.vote().getStatus() != VoteStatus.OPEN) {
            throw new BusinessException(ErrorCode.VOTE_ALREADY_CLOSED);
        }
        if (context.room().getStatus() != RoomStatus.VOTING) {
            throw new BusinessException(ErrorCode.ROOM_CLOSED);
        }
    }
}
