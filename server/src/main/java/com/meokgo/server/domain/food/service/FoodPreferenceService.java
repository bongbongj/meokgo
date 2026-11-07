package com.meokgo.server.domain.food.service;

import com.meokgo.server.api.food.dto.FoodPreferenceResponse;
import com.meokgo.server.global.error.BusinessException;
import com.meokgo.server.global.error.ErrorCode;
import com.meokgo.server.global.error.FieldErrorResponse;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.stereotype.Service;

/**
 * 사전에 등록된 표현만 해석하고 모호한 문장은 사용자 확인 대상으로 남긴다.
 * @author 정효림
 */
@Service
public class FoodPreferenceService {

    private static final Pattern ALLOW = Pattern.compile("괜찮(?:아요|습니다|아|다)?|먹을 ?수 ?있(?:어요|다)?|먹어도 ?(?:돼요|됩니다)");
    private static final Pattern AVOID = Pattern.compile("못 ?먹(?:어요|습니다|어|다)?|안 ?먹(?:어요|습니다|어|다)?|싫(?:어요|습니다|어|다)?|피하고 ?싶(?:어요|습니다|어|다)?|제외(?:해 ?주세요)?|알레르기(?:가 ?있어요)?");
    private static final Pattern PARTICLES = Pattern.compile("^(?:은|는|이|가|을|를|와|과|랑|이랑|도)?$");
    private final FoodDictionary dictionary;

    public FoodPreferenceService(FoodDictionary dictionary) {
        this.dictionary = dictionary;
    }

    public FoodPreferenceResponse preview(String raw) {
        Set<String> avoided = new LinkedHashSet<>();
        Set<String> allowed = new LinkedHashSet<>();
        Set<String> unresolved = new LinkedHashSet<>();
        String normalized = FoodDictionary.normalize(raw == null ? "" : raw);
        if (!normalized.isEmpty()) {
            for (String clause : normalized.split("[,，、;/\\n.!?]+|(?<=괜찮)고\\s*|(?<=싫)고\\s*|그리고\\s*|하지만\\s*")) {
                parseClause(clause.trim(), avoided, allowed, unresolved);
            }
        }
        Set<String> conflicts = dictionary.expand(avoided);
        conflicts.retainAll(dictionary.expand(allowed));
        if (!conflicts.isEmpty()) {
            unresolved.add("허용·기피 표현이 충돌합니다: " + String.join(", ", conflicts));
        }
        return new FoodPreferenceResponse(raw, List.copyOf(avoided),
                List.copyOf(unresolved), !unresolved.isEmpty(), dictionary.version());
    }

    public FoodPreferenceResponse requireResolved(String raw) {
        FoodPreferenceResponse result = preview(raw);
        if (result.needsReview()) {
            throw new BusinessException(ErrorCode.COMMON_INVALID_REQUEST, List.of(new FieldErrorResponse(
                    "avoid_foods", raw, "기피 음식 표현을 확인하고 수정해 주세요: "
                    + String.join(", ", result.unresolvedExpressions()))));
        }
        return result;
    }

    private void parseClause(String clause, Set<String> avoided, Set<String> allowed, Set<String> unresolved) {
        if (clause.isBlank()) {
            return;
        }
        if (clause.matches("없(?:음|어요|습니다)?|없다")) {
            return;
        }
        Matcher matcher = dictionary.aliasPattern().matcher(clause);
        List<String> keywords = new ArrayList<>();
        List<String> gaps = new ArrayList<>();
        int end = 0;
        while (matcher.find()) {
            gaps.add(clause.substring(end, matcher.start()).trim());
            keywords.add(dictionary.canonical(matcher.group()));
            end = matcher.end();
        }
        String tail = clause.substring(end).trim();
        boolean allow = ALLOW.matcher(tail).find();
        boolean avoid = AVOID.matcher(tail).find();
        String remainder = ALLOW.matcher(tail).replaceAll("");
        remainder = AVOID.matcher(remainder).replaceAll("").trim();
        boolean gapsValid = gaps.stream().allMatch(gap -> PARTICLES.matcher(gap).matches());
        if (keywords.isEmpty() || !gapsValid || !PARTICLES.matcher(remainder).matches() || (allow && avoid)) {
            unresolved.add(clause);
            return;
        }
        (allow ? allowed : avoided).addAll(keywords);
    }
}
