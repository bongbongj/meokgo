package com.meokgo.server.api.exploration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.meokgo.server.domain.exploration.repository.QuestProgressRepository;
import com.meokgo.server.domain.quest.domain.FinalQuest;
import com.meokgo.server.domain.quest.domain.Quest;
import com.meokgo.server.domain.quest.domain.QuestType;
import com.meokgo.server.domain.quest.domain.RoomQuestCandidate;
import com.meokgo.server.domain.quest.repository.FinalQuestRepository;
import com.meokgo.server.domain.quest.repository.QuestRepository;
import com.meokgo.server.domain.quest.repository.RoomQuestCandidateRepository;
import com.meokgo.server.domain.quest.repository.UserQuestHistoryRepository;
import com.meokgo.server.domain.record.repository.ExplorationRecordRepository;
import com.meokgo.server.domain.region.domain.Region;
import com.meokgo.server.domain.region.repository.RegionRepository;
import com.meokgo.server.domain.room.domain.ExplorationRoom;
import com.meokgo.server.domain.room.domain.ParticipantStatus;
import com.meokgo.server.domain.room.domain.RoomParticipant;
import com.meokgo.server.domain.room.domain.RoomStatus;
import com.meokgo.server.domain.room.domain.ScheduleType;
import com.meokgo.server.domain.room.repository.ExplorationRoomRepository;
import com.meokgo.server.domain.room.repository.RoomParticipantRepository;
import com.meokgo.server.domain.user.domain.DeviceUser;
import com.meokgo.server.domain.user.repository.DeviceUserRepository;
import jakarta.persistence.EntityManager;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

@SpringBootTest(properties = "spring.datasource.url=jdbc:h2:mem:exploration_test;MODE=MySQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1")
@AutoConfigureMockMvc
@Transactional
class ExplorationFlowTest {

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private DeviceUserRepository userRepository;
    @Autowired
    private RegionRepository regionRepository;
    @Autowired
    private ExplorationRoomRepository roomRepository;
    @Autowired
    private RoomParticipantRepository participantRepository;
    @Autowired
    private QuestRepository questRepository;
    @Autowired
    private RoomQuestCandidateRepository candidateRepository;
    @Autowired
    private FinalQuestRepository finalQuestRepository;
    @Autowired
    private QuestProgressRepository progressRepository;
    @Autowired
    private ExplorationRecordRepository recordRepository;
    @Autowired
    private UserQuestHistoryRepository historyRepository;
    @Autowired
    private EntityManager entityManager;
    @Autowired
    private PlatformTransactionManager transactionManager;
    @Autowired
    private JdbcTemplate jdbcTemplate;

    private record Fixture(ExplorationRoom room, RoomParticipant host, RoomParticipant member,
            String hostKey, String memberKey, List<FinalQuest> quests) {
        String path(String suffix) {
            return "/api/v1/rooms/" + room.getId() + suffix;
        }
    }

    private Fixture fixture() {
        String key = UUID.randomUUID().toString();
        DeviceUser hostUser = userRepository.save(DeviceUser.create(key + "-host", "방장"));
        DeviceUser memberUser = userRepository.save(DeviceUser.create(key + "-member", "참여자"));
        Region region = regionRepository.save(new Region(null, "탐험검증지역", "DISTRICT", 99));
        ExplorationRoom room = roomRepository.save(ExplorationRoom.create(hostUser, region, key.substring(0, 12)));
        RoomParticipant host = participantRepository.save(RoomParticipant.host(room, hostUser, "방장"));
        RoomParticipant member = participantRepository.save(RoomParticipant.member(room, memberUser, "참여자"));
        List<FinalQuest> quests = new ArrayList<>();
        for (int index = 0; index < 3; index++) {
            Quest quest = questRepository.save(new Quest("탐험 " + index, "설명", QuestType.COMMON, ScheduleType.MEAL));
            RoomQuestCandidate candidate = candidateRepository.save(new RoomQuestCandidate(room, quest, index + 1, "후보", 0));
            quests.add(finalQuestRepository.save(new FinalQuest(room, candidate, index + 1, 1, null, null)));
        }
        room.confirmQuests();
        host.ready();
        member.ready();
        return new Fixture(room, host, member, key + "-host", key + "-member", quests);
    }

    private ResultActions start(Fixture fixture, String key) throws Exception {
        return mockMvc.perform(post(fixture.path("/exploration/start")).header("X-Device-Key", key));
    }

    private ResultActions finish(Fixture fixture, String key) throws Exception {
        return mockMvc.perform(post(fixture.path("/exploration/finish")).header("X-Device-Key", key));
    }

    private ResultActions update(Fixture fixture, String key, Long questId, String body) throws Exception {
        return mockMvc.perform(patch(fixture.path("/final-quests/" + questId + "/progress"))
                .header("X-Device-Key", key).contentType(MediaType.APPLICATION_JSON).content(body));
    }

    private ResultActions progress(Fixture fixture, String key) throws Exception {
        return mockMvc.perform(get(fixture.path("/exploration/progress")).header("X-Device-Key", key));
    }

    @Test
    void 탐험을_시작하면_참여자별_진행상태를_생성하고_재요청은_중복생성하지_않는다() throws Exception {
        Fixture fixture = fixture();
        start(fixture, fixture.hostKey()).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.room_status", is("IN_PROGRESS")));
        start(fixture, fixture.hostKey()).andExpect(status().isOk());
        assertThat(fixture.host().getStatus()).isEqualTo(ParticipantStatus.EXPLORING);
        assertThat(fixture.member().getStatus()).isEqualTo(ParticipantStatus.EXPLORING);
        entityManager.flush();
        assertThat(progressRepository.findByFinalQuestIdIn(fixture.quests().stream().map(FinalQuest::getId).toList()))
                .hasSize(6).allMatch(value -> !value.isCompleted());
        progress(fixture, fixture.memberKey()).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.participant_count", is(2)))
                .andExpect(jsonPath("$.data.total_quest_count", is(3)))
                .andExpect(jsonPath("$.data.progress_rate", is(0)))
                .andExpect(jsonPath("$.data.quests", hasSize(3)));
    }

    @Test
    void 본인완료와_완료인원을_구별하고_취소후_다시완료할_수_있다() throws Exception {
        Fixture fixture = fixture();
        Long questId = fixture.quests().getFirst().getId();
        start(fixture, fixture.hostKey()).andExpect(status().isOk());
        update(fixture, fixture.hostKey(), questId, "{\"completed\":true}")
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.completed", is(true)))
                .andExpect(jsonPath("$.data.requires_photo_auth", is(false)))
                .andExpect(jsonPath("$.data.requires_gps_auth", is(false)))
                .andExpect(jsonPath("$.data.requires_receipt_auth", is(false)));
        LocalDateTime completedAt = progressRepository.findByFinalQuestIdIn(List.of(questId)).stream()
                .filter(value -> value.getParticipant().getId().equals(fixture.host().getId()))
                .findFirst().orElseThrow().getCompletedAt();
        update(fixture, fixture.hostKey(), questId, "{\"completed\":true}").andExpect(status().isOk());
        assertThat(progressRepository.findByFinalQuestIdIn(List.of(questId)).stream()
                .filter(value -> value.getParticipant().getId().equals(fixture.host().getId()))
                .findFirst().orElseThrow().getCompletedAt()).isEqualTo(completedAt);
        progress(fixture, fixture.hostKey()).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.completed_quest_count", is(1)))
                .andExpect(jsonPath("$.data.progress_rate", is(33)))
                .andExpect(jsonPath("$.data.quests[0].completed", is(true)));
        progress(fixture, fixture.memberKey()).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.completed_quest_count", is(0)))
                .andExpect(jsonPath("$.data.quests[0].completed", is(false)))
                .andExpect(jsonPath("$.data.quests[0].completed_participant_count", is(1)));
        update(fixture, fixture.memberKey(), questId, "{\"completed\":true}").andExpect(status().isOk());
        progress(fixture, fixture.memberKey()).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.quests[0].completed_participant_count", is(2)));
        update(fixture, fixture.hostKey(), questId, "{\"completed\":false}").andExpect(status().isOk())
                .andExpect(jsonPath("$.data.completed_at", nullValue()));
        progress(fixture, fixture.hostKey()).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.progress_rate", is(0)))
                .andExpect(jsonPath("$.data.quests[0].completed_participant_count", is(1)));
        update(fixture, fixture.hostKey(), questId, "{\"completed\":true}").andExpect(status().isOk());
    }

    @Test
    void 종료시_개인별_기록과_최종완료이력을_저장하고_종료후_수정을_차단한다() throws Exception {
        Fixture fixture = fixture();
        start(fixture, fixture.hostKey()).andExpect(status().isOk());
        Long first = fixture.quests().getFirst().getId();
        Long second = fixture.quests().get(1).getId();
        update(fixture, fixture.hostKey(), first, "{\"completed\":true}").andExpect(status().isOk());
        update(fixture, fixture.hostKey(), second, "{\"completed\":true}").andExpect(status().isOk());
        update(fixture, fixture.hostKey(), second, "{\"completed\":false}").andExpect(status().isOk());
        update(fixture, fixture.memberKey(), first, "{\"completed\":true}").andExpect(status().isOk());
        update(fixture, fixture.memberKey(), second, "{\"completed\":true}").andExpect(status().isOk());
        finish(fixture, fixture.hostKey()).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.room_status", is("FINISHED")))
                .andExpect(jsonPath("$.data.story_optional", is(true)));
        entityManager.flush();
        Long recordId = recordRepository.findByRoomAndUser(fixture.room(), fixture.host().getUser()).orElseThrow().getId();
        assertThat(recordRepository.findByRoomAndUser(fixture.room(), fixture.host().getUser())
                .orElseThrow().getCompletedQuestCount()).isEqualTo(1);
        assertThat(recordRepository.findByRoomAndUser(fixture.room(), fixture.member().getUser())
                .orElseThrow().getCompletedQuestCount()).isEqualTo(2);
        finish(fixture, fixture.hostKey()).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.record_id", is(recordId.intValue())));
        assertThat(jdbcTemplate.queryForObject("select count(*) from exploration_record where room_id = ?",
                Long.class, fixture.room().getId())).isEqualTo(2L);
        assertThat(jdbcTemplate.queryForObject("select count(*) from user_quest_history where room_id = ?",
                Long.class, fixture.room().getId())).isEqualTo(3L);
        assertThat(historyRepository.countCompletedParticipants(List.of(fixture.host().getUser().getId(),
                fixture.member().getUser().getId()), List.of(fixture.quests().getFirst().getCandidate().getQuest().getId())))
                .singleElement().satisfies(value -> assertThat(value.getCompletedParticipantCount()).isEqualTo(2));
        assertThat(fixture.host().getStatus()).isEqualTo(ParticipantStatus.FINISHED);
        assertThat(fixture.member().getStatus()).isEqualTo(ParticipantStatus.FINISHED);
        update(fixture, fixture.hostKey(), first, "{\"completed\":false}").andExpect(status().isConflict());
        start(fixture, fixture.hostKey()).andExpect(status().isConflict());
        progress(fixture, fixture.memberKey()).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.completed_quest_count", is(2)));
    }

    @Test
    void 미완료상태에서도_종료할_수_있고_완료이력은_생기지_않는다() throws Exception {
        Fixture fixture = fixture();
        start(fixture, fixture.hostKey()).andExpect(status().isOk());
        finish(fixture, fixture.hostKey()).andExpect(status().isOk());
        entityManager.flush();
        assertThat(recordRepository.findByRoomAndUser(fixture.room(), fixture.member().getUser())
                .orElseThrow().getCompletedQuestCount()).isZero();
        assertThat(jdbcTemplate.queryForObject("select count(*) from user_quest_history where room_id = ?",
                Long.class, fixture.room().getId())).isZero();
    }

    @Test
    void 시작과_종료는_방장만_가능하고_외부인과_이탈자는_접근하지_못한다() throws Exception {
        Fixture fixture = fixture();
        start(fixture, fixture.memberKey()).andExpect(status().isForbidden());
        start(fixture, fixture.hostKey()).andExpect(status().isOk());
        finish(fixture, fixture.memberKey()).andExpect(status().isForbidden());
        String outsider = UUID.randomUUID().toString();
        userRepository.save(DeviceUser.create(outsider, "외부인"));
        progress(fixture, outsider).andExpect(status().isNotFound());
        update(fixture, outsider, fixture.quests().getFirst().getId(), "{\"completed\":true}")
                .andExpect(status().isNotFound());
        ReflectionTestUtils.setField(fixture.member(), "status", ParticipantStatus.LEFT);
        progress(fixture, fixture.memberKey()).andExpect(status().isNotFound());
        update(fixture, fixture.memberKey(), fixture.quests().getFirst().getId(), "{\"completed\":true}")
                .andExpect(status().isNotFound());
    }

    @Test
    void 다른방_퀘스트와_시작전_진행요청을_거부한다() throws Exception {
        Fixture fixture = fixture();
        Fixture other = fixture();
        progress(fixture, fixture.hostKey()).andExpect(status().isConflict());
        finish(fixture, fixture.hostKey()).andExpect(status().isConflict());
        update(fixture, fixture.hostKey(), fixture.quests().getFirst().getId(), "{\"completed\":true}")
                .andExpect(status().isConflict());
        start(fixture, fixture.hostKey()).andExpect(status().isOk());
        update(fixture, fixture.hostKey(), other.quests().getFirst().getId(), "{\"completed\":true}")
                .andExpect(status().isNotFound()).andExpect(jsonPath("$.code", is("QUEST-001")));
    }

    @ParameterizedTest
    @ValueSource(strings = {"{}", "{\"completed\":null}"})
    void 완료여부가_누락되거나_올바르지_않으면_거부한다(String body) throws Exception {
        Fixture fixture = fixture();
        start(fixture, fixture.hostKey()).andExpect(status().isOk());
        update(fixture, fixture.hostKey(), fixture.quests().getFirst().getId(), body)
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.code", is("COMMON-001")));
    }

    @Test
    void 완료여부에_지원하지_않는_문자열을_전달하면_거부한다() throws Exception {
        Fixture fixture = fixture();
        start(fixture, fixture.hostKey()).andExpect(status().isOk());
        update(fixture, fixture.hostKey(), fixture.quests().getFirst().getId(), "{\"completed\":\"잘못된값\"}")
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.code", is("COMMON-002")));
    }

    @Test
    void 모든퀘스트를_완료하면_진행률이_백퍼센트가_된다() throws Exception {
        Fixture fixture = fixture();
        start(fixture, fixture.hostKey()).andExpect(status().isOk());
        for (FinalQuest quest : fixture.quests()) {
            update(fixture, fixture.memberKey(), quest.getId(), "{\"completed\":true}").andExpect(status().isOk());
        }
        progress(fixture, fixture.memberKey()).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.completed_quest_count", is(3)))
                .andExpect(jsonPath("$.data.progress_rate", is(100)));
    }

    @Test
    void 확정전이나_퀘스트가_부족하면_시작할_수_없다() throws Exception {
        Fixture fixture = fixture();
        ReflectionTestUtils.setField(fixture.room(), "status", RoomStatus.VOTE_CLOSED);
        start(fixture, fixture.hostKey()).andExpect(status().isConflict());
        fixture.room().confirmQuests();
        finalQuestRepository.delete(fixture.quests().getFirst());
        start(fixture, fixture.hostKey()).andExpect(status().isConflict());
        assertThat(fixture.host().getStatus()).isEqualTo(ParticipantStatus.READY);
    }

    @Test
    void 만료된_탐험방은_진행을_변경할_수_없다() throws Exception {
        Fixture fixture = fixture();
        ReflectionTestUtils.setField(fixture.room(), "expiredAt", LocalDateTime.now().minusSeconds(1));
        start(fixture, fixture.hostKey()).andExpect(status().isConflict());
        ReflectionTestUtils.setField(fixture.room(), "expiredAt", LocalDateTime.now().plusHours(1));
        fixture.room().confirmQuests();
        start(fixture, fixture.hostKey()).andExpect(status().isOk());
        ReflectionTestUtils.setField(fixture.room(), "expiredAt", LocalDateTime.now().minusSeconds(1));
        update(fixture, fixture.hostKey(), fixture.quests().getFirst().getId(), "{\"completed\":true}")
                .andExpect(status().isConflict());
        finish(fixture, fixture.hostKey()).andExpect(status().isConflict());
        assertThat(fixture.room().getStatus()).isEqualTo(RoomStatus.EXPIRED);
    }

    @Test
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    void 동시_시작과_종료는_진행상태와_기록을_중복생성하지_않는다() throws Exception {
        Fixture fixture = new TransactionTemplate(transactionManager).execute(value -> fixture());
        assertThat(fixture).isNotNull();
        concurrently(() -> start(fixture, fixture.hostKey()).andReturn().getResponse().getStatus());
        update(fixture, fixture.memberKey(), fixture.quests().getFirst().getId(), "{\"completed\":true}")
                .andExpect(status().isOk());
        concurrently(() -> finish(fixture, fixture.hostKey()).andReturn().getResponse().getStatus());
        assertThat(jdbcTemplate.queryForObject("select count(*) from quest_progress p join final_quest q "
                + "on p.final_quest_id = q.final_quest_id where q.room_id = ?", Long.class, fixture.room().getId()))
                .isEqualTo(6L);
        assertThat(jdbcTemplate.queryForObject("select count(*) from exploration_record where room_id = ?",
                Long.class, fixture.room().getId())).isEqualTo(2L);
        assertThat(jdbcTemplate.queryForObject("select count(*) from user_quest_history where room_id = ?",
                Long.class, fixture.room().getId())).isEqualTo(1L);
    }

    @Test
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    void 완료요청과_종료가_겹쳐도_진행상태와_기록과_이력이_일치한다() throws Exception {
        Fixture fixture = new TransactionTemplate(transactionManager).execute(value -> fixture());
        assertThat(fixture).isNotNull();
        start(fixture, fixture.hostKey()).andExpect(status().isOk());
        List<Integer> statuses = race(List.of(
                () -> update(fixture, fixture.memberKey(), fixture.quests().getFirst().getId(), "{\"completed\":true}")
                        .andReturn().getResponse().getStatus(),
                () -> finish(fixture, fixture.hostKey()).andReturn().getResponse().getStatus()));
        assertThat(statuses.get(0)).isIn(200, 409);
        assertThat(statuses.get(1)).isEqualTo(200);
        Long completed = jdbcTemplate.queryForObject("select count(*) from quest_progress p join final_quest q "
                + "on p.final_quest_id = q.final_quest_id where q.room_id = ? and p.progress_status = 'DONE'",
                Long.class, fixture.room().getId());
        assertThat(jdbcTemplate.queryForObject("select sum(completed_quest_count) from exploration_record where room_id = ?",
                Long.class, fixture.room().getId())).isEqualTo(completed);
        assertThat(jdbcTemplate.queryForObject("select count(*) from user_quest_history where room_id = ?",
                Long.class, fixture.room().getId())).isEqualTo(completed);
    }

    private void concurrently(Callable<Integer> action) throws Exception {
        assertThat(race(List.of(action, action))).containsOnly(200);
    }

    private List<Integer> race(List<Callable<Integer>> actions) throws Exception {
        CountDownLatch ready = new CountDownLatch(2);
        CountDownLatch go = new CountDownLatch(1);
        try (ExecutorService executor = Executors.newFixedThreadPool(2)) {
            List<Future<Integer>> requests = new ArrayList<>();
            for (Callable<Integer> action : actions) {
                requests.add(executor.submit(() -> {
                    ready.countDown();
                    if (!go.await(10, TimeUnit.SECONDS)) {
                        throw new IllegalStateException("동시 요청 대기 시간이 초과되었습니다.");
                    }
                    return action.call();
                }));
            }
            try {
                assertThat(ready.await(10, TimeUnit.SECONDS)).isTrue();
            } finally {
                go.countDown();
            }
            List<Integer> statuses = new ArrayList<>();
            for (Future<Integer> request : requests) {
                statuses.add(request.get(15, TimeUnit.SECONDS));
            }
            return statuses;
        }
    }
}
