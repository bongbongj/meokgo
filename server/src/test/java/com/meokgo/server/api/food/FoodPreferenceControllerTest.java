package com.meokgo.server.api.food;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class FoodPreferenceControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void 자유_입력_해석_결과를_조회한다() throws Exception {
        mockMvc.perform(post("/api/v1/food-preferences/preview")
                        .header("X-Device-Key", "food-device")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"avoid_foods\":\"새우는 괜찮고 고수는 싫어요\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.recognized_avoid_keywords[0]", is("고수")))
                .andExpect(jsonPath("$.data.recognized_allowed_keywords").doesNotExist())
                .andExpect(jsonPath("$.data.needs_review", is(false)));
    }

    @Test
    void 미인식_표현을_확인_대상으로_반환한다() throws Exception {
        mockMvc.perform(post("/api/v1/food-preferences/preview")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"avoid_foods\":\"정체불명음식\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.needs_review", is(true)))
                .andExpect(jsonPath("$.data.unresolved_expressions", hasSize(1)));
    }

    @Test
    void 입력_길이를_검증한다() throws Exception {
        mockMvc.perform(post("/api/v1/food-preferences/preview")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"avoid_foods\":\"" + "가".repeat(501) + "\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code", is("COMMON-001")));
    }
}
