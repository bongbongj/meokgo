package com.meokgo.server.global.init;

import static org.assertj.core.api.Assertions.assertThat;

import com.meokgo.server.domain.region.domain.Region;
import com.meokgo.server.domain.region.repository.RegionRepository;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.DefaultApplicationArguments;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest(properties = "spring.datasource.url=jdbc:h2:mem:region_loader_test;MODE=MySQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1")
@Transactional
class InitialDataLoaderTest {

    @Autowired
    private InitialDataLoader initialDataLoader;

    @Autowired
    private RegionRepository regionRepository;

    @BeforeEach
    void setUp() {
        regionRepository.deleteAll();
    }

    @Test
    void 초기_지역_20개를_지정된_순서로_등록한다() {
        initialDataLoader.run(new DefaultApplicationArguments());

        List<Region> regions = regionRepository.findByActiveTrueOrderByDisplayOrderAscNameAsc();
        assertThat(regions).extracting(Region::getName).containsExactly(
                "성수", "홍대", "잠실", "연남동", "망원동", "합정", "한남동", "이태원", "서촌", "북촌",
                "익선동", "을지로", "강남", "신사", "가로수길", "압구정", "건대", "신촌", "문래", "여의도"
        );
        assertThat(regions).extracting(Region::getDisplayOrder)
                .containsExactly(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20);
        assertThat(regions).allSatisfy(region -> {
            assertThat(region.getParentRegionId()).isNull();
            assertThat(region.getLevel()).isEqualTo("DISTRICT");
        });
        assertThat(regions).filteredOn(region -> List.of(
                        "성수", "홍대", "잠실", "망원동", "북촌", "익선동", "을지로", "강남", "신사"
                ).contains(region.getName()))
                .allSatisfy(region -> assertThat(region.getImageUrl())
                        .startsWith("http://localhost:8080/region-images/"));
        assertThat(regions).filteredOn(region -> !List.of(
                        "성수", "홍대", "잠실", "망원동", "북촌", "익선동", "을지로", "강남", "신사"
                ).contains(region.getName()))
                .allSatisfy(region -> assertThat(region.getImageUrl()).isNull());
    }

    @Test
    void 기존_지역의_ID와_이미지를_유지하며_망원을_망원동으로_변경한다() {
        Region hongdae = regionRepository.save(new Region(null, "홍대", "DISTRICT", 1));
        Region seongsu = regionRepository.save(new Region(null, "성수", "DISTRICT", 2));
        Region mangwon = new Region(null, "망원", "DISTRICT", 3);
        mangwon.updateImageUrl("https://images.example.com/regions/mangwon.webp");
        regionRepository.save(mangwon);

        initialDataLoader.run(new DefaultApplicationArguments());
        regionRepository.flush();

        assertThat(regionRepository.count()).isEqualTo(20);
        assertThat(regionRepository.findById(hongdae.getId()).orElseThrow().getDisplayOrder()).isEqualTo(2);
        assertThat(regionRepository.findById(seongsu.getId()).orElseThrow().getDisplayOrder()).isEqualTo(1);
        Region updated = regionRepository.findById(mangwon.getId()).orElseThrow();
        assertThat(updated.getName()).isEqualTo("망원동");
        assertThat(updated.getDisplayOrder()).isEqualTo(5);
        assertThat(updated.getImageUrl()).isEqualTo("https://images.example.com/regions/mangwon.webp");
    }

    @Test
    void 초기화를_반복해도_지역을_중복_등록하지_않는다() {
        initialDataLoader.run(new DefaultApplicationArguments());
        List<Long> originalIds = regionRepository.findByActiveTrueOrderByDisplayOrderAscNameAsc().stream()
                .map(Region::getId)
                .toList();

        initialDataLoader.run(new DefaultApplicationArguments());

        assertThat(regionRepository.count()).isEqualTo(20);
        assertThat(regionRepository.findByActiveTrueOrderByDisplayOrderAscNameAsc())
                .extracting(Region::getId).containsExactlyElementsOf(originalIds);
    }
}
