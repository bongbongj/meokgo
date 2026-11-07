package com.meokgo.server.api.vote;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.jayway.jsonpath.JsonPath;
import com.meokgo.server.domain.quest.repository.FinalQuestRepository;
import com.meokgo.server.domain.region.repository.RegionRepository;
import com.meokgo.server.domain.room.repository.ExplorationRoomRepository;
import com.meokgo.server.domain.vote.domain.VoteStatus;
import com.meokgo.server.domain.vote.repository.VoteRepository;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

@SpringBootTest(properties = "spring.datasource.url=jdbc:h2:mem:vote_concurrency_test;MODE=MySQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1")
@AutoConfigureMockMvc
class VoteConcurrencyTest {

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private RegionRepository regionRepository;
    @Autowired
    private ExplorationRoomRepository roomRepository;
    @Autowired
    private VoteRepository voteRepository;
    @Autowired
    private FinalQuestRepository finalQuestRepository;

    private record Fixture(long roomId, String deviceKey, List<Integer> ids) {
        String path(String suffix) {
            return "/api/v1/rooms/" + roomId + suffix;
        }
    }

    private Fixture fixture() throws Exception {
        String deviceKey = "race-" + UUID.randomUUID();
        long regionId = regionRepository.findAll().getFirst().getId();
        String roomJson = mockMvc.perform(post("/api/v1/rooms").header("X-Device-Key", deviceKey)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"region_id": %d, "schedule_type": "MEAL", "drinking_option": "ANY"}
                                """.formatted(regionId)))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        long roomId = ((Number) JsonPath.read(roomJson, "$.data.room_id")).longValue();
        String base = "/api/v1/rooms/" + roomId;
        String candidateJson = mockMvc.perform(post(base + "/quest-candidates").header("X-Device-Key", deviceKey))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        List<Integer> ids = JsonPath.read(candidateJson, "$.data.candidates[*].candidate_id");
        mockMvc.perform(post(base + "/vote/start").header("X-Device-Key", deviceKey)).andExpect(status().isOk());
        return new Fixture(roomId, deviceKey, ids);
    }

    private MockHttpServletRequestBuilder request(Fixture fixture, String suffix, String body) {
        var builder = post(fixture.path(suffix)).header("X-Device-Key", fixture.deviceKey());
        return body == null ? builder : builder.contentType(MediaType.APPLICATION_JSON).content(body);
    }

    private <T> List<T> race(Callable<T> first, Callable<T> second) throws Exception {
        CountDownLatch ready = new CountDownLatch(2);
        CountDownLatch start = new CountDownLatch(1);
        try (var executor = Executors.newFixedThreadPool(2)) {
            var left = executor.submit(() -> {
                ready.countDown();
                if (!start.await(10, TimeUnit.SECONDS)) {
                    throw new IllegalStateException("동시 요청 시작 시간 초과");
                }
                return first.call();
            });
            var right = executor.submit(() -> {
                ready.countDown();
                if (!start.await(10, TimeUnit.SECONDS)) {
                    throw new IllegalStateException("동시 요청 시작 시간 초과");
                }
                return second.call();
            });
            assertThat(ready.await(10, TimeUnit.SECONDS)).isTrue();
            start.countDown();
            return List.of(left.get(20, TimeUnit.SECONDS), right.get(20, TimeUnit.SECONDS));
        }
    }

    @Test
    void 투표와_마감이_동시에_실행되어도_마감후_투표를_저장하지_않는다() throws Exception {
        Fixture fixture = fixture();
        List<Integer> codes = race(
                () -> mockMvc.perform(request(fixture, "/votes/me", "{\"candidate_ids\":"
                        + fixture.ids().subList(0, 1) + "}")).andReturn().getResponse().getStatus(),
                () -> mockMvc.perform(request(fixture, "/votes/close", "{\"confirmed\":true}"))
                        .andReturn().getResponse().getStatus());
        assertThat(codes.get(0)).isIn(200, 409);
        assertThat(codes.get(1)).isEqualTo(200);
        var room = roomRepository.findById(fixture.roomId()).orElseThrow();
        var vote = voteRepository.findByRoom(room).orElseThrow();
        assertThat(vote.getStatus()).isEqualTo(VoteStatus.CLOSED);
        assertThat(vote.getNotVotedCountAtClose()).isEqualTo(codes.get(0) == 200 ? 0 : 1);
        mockMvc.perform(request(fixture, "/votes/me", "{\"candidate_ids\":" + fixture.ids().subList(1, 2) + "}"))
                .andExpect(status().isConflict());
    }

    @Test
    void 최종_확정_동시요청은_같은_세개_ID를_반환한다() throws Exception {
        Fixture fixture = fixture();
        mockMvc.perform(request(fixture, "/votes/close", "{\"confirmed\":true}")).andExpect(status().isOk());
        mockMvc.perform(request(fixture, "/final-quests/tie-break", "{\"selected_candidate_ids\":"
                        + fixture.ids().subList(0, 3) + "}"))
                .andExpect(status().isOk());
        Callable<List<Integer>> confirm = () -> {
            String body = mockMvc.perform(request(fixture, "/final-quests", null))
                    .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
            return JsonPath.read(body, "$.data.final_quests[*].final_quest_id");
        };
        List<List<Integer>> results = race(confirm, confirm);
        assertThat(results.get(0)).hasSize(3).containsExactlyElementsOf(results.get(1));
        assertThat(finalQuestRepository.findByRoomOrderByRankNoAsc(
                roomRepository.findById(fixture.roomId()).orElseThrow())).hasSize(3);
    }
}
