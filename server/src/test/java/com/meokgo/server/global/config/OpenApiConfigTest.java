package com.meokgo.server.global.config;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class OpenApiConfigTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void OpenAPI_문서를_조회한다() throws Exception {
        mockMvc.perform(get("/api-docs"))
                .andExpect(status().isOk());
    }

    @Test
    void Swagger_필드명을_실제_API와_일치시킨다() throws Exception {
        mockMvc.perform(get("/api-docs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.components.schemas.FoodPreferenceRequest.properties.avoid_foods").exists())
                .andExpect(jsonPath("$.components.schemas.FoodPreferenceRequest.properties.avoidFoods").doesNotExist())
                .andExpect(jsonPath("$.components.schemas.CreateRoomRequest.properties.region_id").exists())
                .andExpect(jsonPath("$.components.schemas.CreateRoomRequest.properties.drinking_option").exists())
                .andExpect(jsonPath("$.components.schemas.VoteRequest.properties.candidate_ids").exists())
                .andExpect(jsonPath("$.components.schemas.FoodPreferenceResponse.properties.recognized_avoid_keywords").exists())
                .andExpect(jsonPath("$.components.schemas.FoodPreferenceResponse.properties.recognized_allowed_keywords").doesNotExist());
    }

    @Test
    void Swagger_UI를_조회한다() throws Exception {
        mockMvc.perform(get("/swagger-ui/index.html"))
                .andExpect(status().isOk());
    }
}
