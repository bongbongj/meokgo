package com.meokgo.server.domain.region.domain;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullSource;
import org.junit.jupiter.params.provider.ValueSource;

/**
 * 지역 대표 이미지 주소의 등록과 미등록 정책을 검증한다.
 *
 * @author 정효림
 */
class RegionTest {

    @ParameterizedTest
    @NullSource
    @ValueSource(strings = {"", "   "})
    void 빈주소로_변경하면_이미지등록을_해제한다(String value) {
        Region region = new Region(null, "추가지역", "DISTRICT", 1);
        region.updateImageUrl("https://images.example.com/region.webp");
        region.updateImageUrl(value);
        assertThat(region.getImageUrl()).isNull();
    }

    @ParameterizedTest
    @ValueSource(strings = {"http://images.example.com/a.jpg", "/region/a.jpg", "https:///a.jpg",
            "https://user:password@images.example.com/a.jpg", "https://invalid host/a.jpg"})
    void 유효하지_않은주소를_거부한다(String value) {
        Region region = new Region(null, "추가지역", "DISTRICT", 1);
        assertThatThrownBy(() -> region.updateImageUrl(value)).isInstanceOf(IllegalArgumentException.class);
        assertThat(region.getImageUrl()).isNull();
    }

    @ParameterizedTest
    @ValueSource(ints = {500, 501})
    void 주소길이는_오백자까지_허용한다(int length) {
        Region region = new Region(null, "추가지역", "DISTRICT", 1);
        String prefix = "https://images.example.com/";
        String value = prefix + "a".repeat(length - prefix.length());
        if (length == 500) {
            region.updateImageUrl(value);
            assertThat(region.getImageUrl()).isEqualTo(value);
        } else {
            assertThatThrownBy(() -> region.updateImageUrl(value)).isInstanceOf(IllegalArgumentException.class);
        }
    }
}
