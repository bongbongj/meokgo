package com.meokgo.server.api.vote;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.jayway.jsonpath.JsonPath;
import com.meokgo.server.domain.region.domain.Region;
import com.meokgo.server.domain.region.repository.RegionRepository;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest
@AutoConfigureMockMvc
class VoteFlowTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private RegionRepository regionRepository;

    @Test
    void 초대_참여자가_퀘스트_후보에_투표한다() throws Exception {
        Region region = regionRepository.save(new Region(null, "투표테스트지역", "DISTRICT", 99));

        mockMvc.perform(post("/api/v1/users/me/nickname")
                        .header("X-Device-Key", "host-device")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nickname\":\"방장\"}"))
                .andExpect(status().isOk());

        MvcResult roomResult = mockMvc.perform(post("/api/v1/rooms")
                        .header("X-Device-Key", "host-device")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "region_id": %d,
                                  "schedule_type": "MEAL",
                                  "time_slot": "DINNER",
                                  "budget_min": 10000,
                                  "budget_max": 30000,
                                  "drinking_option": "ANY",
                                  "avoid_foods": "매운 음식"
                                }
                                """.formatted(region.getId())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andReturn();

        String roomContent = roomResult.getResponse().getContentAsString();
        Integer roomId = JsonPath.read(roomContent, "$.data.room_id");
        String inviteUrl = JsonPath.read(roomContent, "$.data.invite_url");
        String inviteToken = inviteUrl.substring(inviteUrl.lastIndexOf('/') + 1);

        mockMvc.perform(get("/api/v1/invites/{inviteToken}", inviteToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.joinable", is(true)));

        mockMvc.perform(post("/api/v1/invites/{inviteToken}/join", inviteToken)
                        .header("X-Device-Key", "member-device")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nickname\":\"민수\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.restored_by_device", is(false)));

        MvcResult candidateResult = mockMvc.perform(post("/api/v1/rooms/{roomId}/quest-candidates", roomId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.candidates", hasSize(6)))
                .andReturn();

        List<Integer> candidateIds = JsonPath.read(
                candidateResult.getResponse().getContentAsString(),
                "$.data.candidates[0:3].candidate_id"
        );

        mockMvc.perform(post("/api/v1/rooms/{roomId}/vote/start", roomId)
                        .header("X-Device-Key", "host-device"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.room_status", is("VOTING")));

        mockMvc.perform(post("/api/v1/rooms/{roomId}/votes/me", roomId)
                        .header("X-Device-Key", "member-device")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "candidate_ids": [%d, %d, %d]
                                }
                                """.formatted(candidateIds.get(0), candidateIds.get(1), candidateIds.get(2))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.voted", is(true)))
                .andExpect(jsonPath("$.data.candidate_ids", hasSize(3)));
    }
}
