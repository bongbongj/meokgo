package com.meokgo.server.domain.food.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.meokgo.server.global.error.BusinessException;
import java.io.IOException;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

class FoodPreferenceServiceTest {

    private FoodDictionary dictionary;
    private FoodPreferenceService service;

    @BeforeEach
    void setUp() throws IOException {
        dictionary = new FoodDictionary();
        service = new FoodPreferenceService(dictionary);
    }

    @Test
    void 동의어와_중복을_정리하고_원문은_보존한다() {
        String raw = "  매운 거, 매운 음식, 고수는 못 먹어요  ";
        var result = service.preview(raw);
        assertThat(result.avoidFoods()).isEqualTo(raw);
        assertThat(result.recognizedAvoidKeywords()).containsExactly("매운맛", "고수");
        assertThat(result.needsReview()).isFalse();
        assertThat(result.dictionaryVersion()).isEqualTo("1");
    }

    @Test
    void 허용과_기피_표현을_구분한다() {
        var result = service.preview("새우는 괜찮고 고수는 싫어요");
        assertThat(result.recognizedAvoidKeywords()).containsExactly("고수");
        assertThat(result.needsReview()).isFalse();
    }

    @Test
    void 허용_표현만_있으면_기피_키워드를_반환하지_않는다() {
        var result = service.preview("새우는 괜찮아요");
        assertThat(result.recognizedAvoidKeywords()).isEmpty();
        assertThat(result.needsReview()).isFalse();
    }

    @Test
    void 나열한_음식과_줄바꿈을_처리한다() {
        var result = service.preview("새우랑 게는 피하고 싶어요\n고수");
        assertThat(result.recognizedAvoidKeywords()).containsExactly("새우", "게", "고수");
        assertThat(result.needsReview()).isFalse();
    }

    @ParameterizedTest
    @ValueSource(strings = {"새우는 괜찮아요, 새우는 싫어요", "해산물은 싫어요, 새우는 괜찮아요",
            "고수풀과 정체불명음식", "게살버거", "고수는 안 싫어요", "새우는 괜찮지 않아요", "새우 말고 고수"})
    void 모호하거나_인식하지_못한_표현은_수정을_요청한다(String raw) {
        assertThat(service.preview(raw).needsReview()).isTrue();
        assertThatThrownBy(() -> service.requireResolved(raw)).isInstanceOf(BusinessException.class);
    }

    @Test
    void 상위_분류는_하위로만_확장한다() {
        assertThat(dictionary.expand(List.of("해산물"))).contains("새우", "게", "생선");
        assertThat(dictionary.expand(List.of("새우"))).doesNotContain("해산물", "게");
    }

    @Test
    void 빈_입력은_기피_음식이_없다() {
        for (String raw : new String[] {null, "", "  ", "없음"}) {
            assertThat(service.preview(raw).recognizedAvoidKeywords()).isEmpty();
            assertThat(service.preview(raw).needsReview()).isFalse();
        }
    }
}
