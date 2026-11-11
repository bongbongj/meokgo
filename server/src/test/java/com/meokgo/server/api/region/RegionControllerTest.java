package com.meokgo.server.api.region;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.meokgo.server.domain.region.domain.Region;
import com.meokgo.server.domain.region.domain.UserRecentRegion;
import com.meokgo.server.domain.region.repository.RegionRepository;
import com.meokgo.server.domain.region.repository.UserRecentRegionRepository;
import com.meokgo.server.domain.user.domain.DeviceUser;
import com.meokgo.server.domain.user.repository.DeviceUserRepository;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@AutoConfigureMockMvc
class RegionControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private RegionRepository regionRepository;

    @Autowired
    private UserRecentRegionRepository recentRegionRepository;

    @Autowired
    private DeviceUserRepository userRepository;

    @ParameterizedTest
    @NullSource
    @ValueSource(strings = "https://images.example.com/regions/sample.webp")
    @Transactional
    void 임의의_지역과_최근선택지역에_대표이미지_또는_널을_반환한다(String imageUrl) throws Exception {
        Region region = new Region(null, "추가지역", "DISTRICT", 99);
        region.updateImageUrl(imageUrl);
        regionRepository.save(region);
        DeviceUser user = userRepository.save(DeviceUser.create(UUID.randomUUID().toString(), "탐험가"));
        recentRegionRepository.save(new UserRecentRegion(user, region));

        mockMvc.perform(get("/api/v1/regions").param("keyword", "추가지역"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.regions", hasSize(1)))
                .andExpect(jsonPath("$.data.regions[0].region_image_url").hasJsonPath())
                .andExpect(jsonPath("$.data.regions[0].region_image_url", imageUrl == null ? nullValue() : is(imageUrl)));
        mockMvc.perform(get("/api/v1/users/me/recent-regions").header("X-Device-Key", user.getDeviceKey()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.recent_regions", hasSize(1)))
                .andExpect(jsonPath("$.data.recent_regions[0].region_image_url").hasJsonPath())
                .andExpect(jsonPath("$.data.recent_regions[0].region_image_url", imageUrl == null ? nullValue() : is(imageUrl)));
    }

    @BeforeEach
    void setUp() {
        regionRepository.deleteAll();
    }

    @Test
    void 지역을_검색한다() throws Exception {
        regionRepository.save(new Region(null, "홍대", "DISTRICT", 1));
        regionRepository.save(new Region(null, "성수", "DISTRICT", 2));

        mockMvc.perform(get("/api/v1/regions")
                        .param("keyword", "홍"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.regions", hasSize(1)))
                .andExpect(jsonPath("$.data.regions[0].region_name", is("홍대")));
    }

    @Test
    void 지역대표이미지를_정적리소스로_제공한다() throws Exception {
        mockMvc.perform(get("/region-images/hongdae.jpg"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.IMAGE_JPEG));
    }

    @Test
    void 사용자가_없으면_최근_지역은_빈_목록이다() throws Exception {
        mockMvc.perform(get("/api/v1/users/me/recent-regions")
                        .header("X-Device-Key", "unknown-device"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.recent_regions", hasSize(0)));
    }
}
