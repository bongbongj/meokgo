package com.meokgo.server.domain.quest.service;

import com.meokgo.server.domain.vote.service.VoteResultService.ScoredCandidate;
import com.meokgo.server.global.error.BusinessException;
import com.meokgo.server.global.error.ErrorCode;
import java.util.List;
import org.springframework.stereotype.Component;

/**
 * 최종 선정 경계의 동점만 방장 선택 대상으로 구분한다.
 * @author 정효림
 */
@Component
public class FinalQuestPlanner {

    public record Plan(List<ScoredCandidate> guaranteed, List<ScoredCandidate> tied, int requiredSelectCount) {
        public boolean requiresTieBreak() {
            return requiredSelectCount > 0;
        }
    }

    public Plan plan(List<ScoredCandidate> ranked) {
        if (ranked.size() < 3) {
            throw new BusinessException(ErrorCode.QUEST_CANDIDATE_INSUFFICIENT);
        }
        long cutoff = ranked.get(2).voteCount();
        List<ScoredCandidate> guaranteed = ranked.stream().filter(value -> value.voteCount() > cutoff).toList();
        List<ScoredCandidate> tied = ranked.stream().filter(value -> value.voteCount() == cutoff).toList();
        int required = 3 - guaranteed.size();
        if (tied.size() <= required) {
            return new Plan(List.copyOf(ranked.subList(0, 3)), List.of(), 0);
        }
        return new Plan(guaranteed, tied, required);
    }
}
