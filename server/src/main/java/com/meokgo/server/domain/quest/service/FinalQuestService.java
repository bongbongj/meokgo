package com.meokgo.server.domain.quest.service;

import com.meokgo.server.api.quest.dto.ConfirmFinalQuestsResponse;
import com.meokgo.server.api.quest.dto.FinalQuestCandidateResponse;
import com.meokgo.server.api.quest.dto.FinalQuestItemResponse;
import com.meokgo.server.api.quest.dto.FinalQuestPreviewResponse;
import com.meokgo.server.api.quest.dto.TieBreakResponse;
import com.meokgo.server.api.quest.dto.TieGroupResponse;
import com.meokgo.server.domain.quest.domain.FinalQuest;
import com.meokgo.server.domain.quest.repository.FinalQuestRepository;
import com.meokgo.server.domain.quest.service.FinalQuestPlanner.Plan;
import com.meokgo.server.domain.room.domain.RoomStatus;
import com.meokgo.server.domain.vote.domain.VoteStatus;
import com.meokgo.server.domain.vote.service.VoteAccessService.Context;
import com.meokgo.server.domain.vote.service.VoteAccessService;
import com.meokgo.server.domain.vote.service.VoteResultService.ScoredCandidate;
import com.meokgo.server.domain.vote.service.VoteResultService;
import com.meokgo.server.global.error.BusinessException;
import com.meokgo.server.global.error.ErrorCode;
import com.meokgo.server.global.error.FieldErrorResponse;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.IntStream;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class FinalQuestService {

    private final VoteAccessService accessService;
    private final VoteResultService resultService;
    private final FinalQuestPlanner planner;
    private final FinalQuestRepository finalQuestRepository;

    public FinalQuestService(VoteAccessService accessService, VoteResultService resultService,
            FinalQuestPlanner planner, FinalQuestRepository finalQuestRepository) {
        this.accessService = accessService;
        this.resultService = resultService;
        this.planner = planner;
        this.finalQuestRepository = finalQuestRepository;
    }

    @Transactional
    public FinalQuestPreviewResponse preview(String deviceKey, Long roomId) {
        Context context = accessService.read(deviceKey, roomId);
        requireClosed(context);
        List<FinalQuest> confirmed = finalQuestRepository.findByRoomOrderByRankNoAsc(context.room());
        if (!confirmed.isEmpty()) {
            return new FinalQuestPreviewResponse(false, true, confirmed.stream()
                    .map(value -> new FinalQuestCandidateResponse(value.getCandidate().getId(),
                            value.getCandidate().getQuest().getTitle(), value.getVoteCount(), value.getRankNo()))
                    .toList(), List.of());
        }
        Plan plan = planner.plan(resultService.ranked(context.vote()));
        List<Long> selected = context.vote().getTieBreakCandidateIds();
        if (plan.requiresTieBreak() && !validChoice(plan, selected)) {
            return new FinalQuestPreviewResponse(true, false, previewItems(plan.guaranteed()),
                    List.of(new TieGroupResponse(1, plan.requiredSelectCount(),
                            plan.tied().stream().map(ScoredCandidate::response).toList())));
        }
        return new FinalQuestPreviewResponse(false, true, previewItems(resolve(plan, selected)), List.of());
    }

    @Transactional
    public TieBreakResponse selectTieBreak(String deviceKey, Long roomId, List<Long> selectedIds) {
        Context context = accessService.lock(deviceKey, roomId);
        accessService.requireHost(context);
        requireClosed(context);
        requireUnconfirmed(context);
        Plan plan = planner.plan(resultService.ranked(context.vote()));
        if (!plan.requiresTieBreak() || !validChoice(plan, selectedIds)) {
            throw new BusinessException(ErrorCode.COMMON_INVALID_REQUEST, List.of(new FieldErrorResponse(
                    "selected_candidate_ids", selectedIds, "동점 후보 중 필요한 개수만 중복 없이 선택해 주세요.")));
        }
        context.vote().selectTieBreak(selectedIds, context.participant());
        context.room().touchHostAction();
        return new TieBreakResponse(roomId, true, List.copyOf(selectedIds));
    }

    @Transactional
    public ConfirmFinalQuestsResponse confirm(String deviceKey, Long roomId) {
        Context context = accessService.lock(deviceKey, roomId);
        accessService.requireHost(context);
        requireClosed(context);
        List<FinalQuest> existing = finalQuestRepository.findByRoomOrderByRankNoAsc(context.room());
        if (!existing.isEmpty()) {
            return response(context, existing);
        }
        requireUnconfirmed(context);
        Plan plan = planner.plan(resultService.ranked(context.vote()));
        List<Long> selectedIds = context.vote().getTieBreakCandidateIds();
        if (plan.requiresTieBreak() && !validChoice(plan, selectedIds)) {
            throw new BusinessException(ErrorCode.FINAL_TIE_BREAK_REQUIRED);
        }
        List<ScoredCandidate> selected = resolve(plan, selectedIds);
        List<FinalQuest> finalQuests = new ArrayList<>();
        for (int index = 0; index < selected.size(); index++) {
            ScoredCandidate item = selected.get(index);
            int tieIndex = selectedIds.indexOf(item.candidate().getId());
            boolean hostSelected = plan.requiresTieBreak() && tieIndex >= 0;
            finalQuests.add(new FinalQuest(context.room(), item.candidate(), index + 1, item.voteCount(),
                    hostSelected ? context.vote().getTieBreakHost() : null,
                    hostSelected ? tieIndex + 1 : null));
        }
        List<FinalQuest> saved = finalQuestRepository.saveAll(finalQuests);
        accessService.activeParticipants(context.room()).forEach(participant -> participant.ready());
        context.room().confirmQuests();
        return response(context, saved);
    }

    private boolean validChoice(Plan plan, List<Long> ids) {
        Set<Long> unique = new HashSet<>(ids);
        Set<Long> eligible = plan.tied().stream().map(item -> item.candidate().getId())
                .collect(Collectors.toSet());
        return ids.size() == plan.requiredSelectCount() && unique.size() == ids.size()
                && eligible.containsAll(ids);
    }

    private List<ScoredCandidate> resolve(Plan plan, List<Long> selectedIds) {
        List<ScoredCandidate> selected = new ArrayList<>(plan.guaranteed());
        if (plan.requiresTieBreak()) {
            for (Long id : selectedIds) {
                selected.add(plan.tied().stream().filter(item -> item.candidate().getId().equals(id))
                        .findFirst().orElseThrow());
            }
        }
        return selected;
    }

    private List<FinalQuestCandidateResponse> previewItems(List<ScoredCandidate> items) {
        return IntStream.range(0, items.size()).mapToObj(index -> {
            ScoredCandidate item = items.get(index);
            return new FinalQuestCandidateResponse(item.candidate().getId(), item.candidate().getQuest().getTitle(),
                    item.voteCount(), index + 1);
        }).toList();
    }

    private ConfirmFinalQuestsResponse response(Context context, List<FinalQuest> values) {
        return new ConfirmFinalQuestsResponse(context.room().getId(), context.room().getStatus().name(),
                values.stream().map(value -> new FinalQuestItemResponse(value.getId(), value.getRankNo(),
                        value.getCandidate().getQuest().getTitle(), value.getVoteCount(),
                        value.getSelectionReason().name())).toList());
    }

    private void requireClosed(Context context) {
        if (context.vote().getStatus() != VoteStatus.CLOSED) {
            throw new BusinessException(ErrorCode.ROOM_CLOSED, "투표 마감 후 최종 퀘스트를 선택할 수 있습니다.");
        }
    }

    private void requireUnconfirmed(Context context) {
        if (context.room().getStatus() != RoomStatus.VOTE_CLOSED) {
            throw new BusinessException(ErrorCode.ROOM_ALREADY_STARTED);
        }
    }
}
