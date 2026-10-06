package com.meokgo.server.api.region;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.meokgo.server.domain.region.domain.Region;
import com.meokgo.server.domain.region.repository.RegionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class RegionControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private RegionRepository regionRepository;

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
    void 사용자가_없으면_최근_지역은_빈_목록이다() throws Exception {
        mockMvc.perform(get("/api/v1/users/me/recent-regions")
                        .header("X-Device-Key", "unknown-device"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.recent_regions", hasSize(0)));
    }
}
