package com.meokgo.server.api.room;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.jayway.jsonpath.JsonPath;
import com.meokgo.server.api.food.dto.FoodPreferenceResponse;
import com.meokgo.server.domain.quest.domain.Quest;
import com.meokgo.server.domain.quest.domain.QuestType;
import com.meokgo.server.domain.quest.domain.RoomQuestCandidate;
import com.meokgo.server.domain.quest.repository.QuestRepository;
import com.meokgo.server.domain.quest.repository.RoomQuestCandidateRepository;
import com.meokgo.server.domain.record.domain.ExplorationRecord;
import com.meokgo.server.domain.record.repository.ExplorationRecordRepository;
import com.meokgo.server.domain.region.domain.Region;
import com.meokgo.server.domain.region.repository.RegionRepository;
import com.meokgo.server.domain.region.repository.UserRecentRegionRepository;
import com.meokgo.server.domain.room.domain.DrinkingOption;
import com.meokgo.server.domain.room.domain.ExplorationCondition;
import com.meokgo.server.domain.room.domain.ExplorationRoom;
import com.meokgo.server.domain.room.domain.InviteLink;
import com.meokgo.server.domain.room.domain.ParticipantRole;
import com.meokgo.server.domain.room.domain.ParticipantStatus;
import com.meokgo.server.domain.room.domain.RoomParticipant;
import com.meokgo.server.domain.room.domain.RoomStatus;
import com.meokgo.server.domain.room.domain.ScheduleType;
import com.meokgo.server.domain.room.domain.TimeSlot;
import com.meokgo.server.domain.room.repository.ExplorationConditionRepository;
import com.meokgo.server.domain.room.repository.ExplorationRoomRepository;
import com.meokgo.server.domain.room.repository.InviteLinkRepository;
import com.meokgo.server.domain.room.repository.RoomParticipantRepository;
import com.meokgo.server.domain.room.service.RoomExpirationService;
import com.meokgo.server.domain.user.domain.DeviceUser;
import com.meokgo.server.domain.user.repository.DeviceUserRepository;
import jakarta.persistence.EntityManager;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:room_recovery_test;MODE=MySQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1",
        "app.room.expiration.interval-ms=3600000"
})
@AutoConfigureMockMvc
@Transactional
class RoomRecoveryFlowTest {

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
    private InviteLinkRepository inviteRepository;
    @Autowired
    private ExplorationConditionRepository conditionRepository;
    @Autowired
    private QuestRepository questRepository;
    @Autowired
    private RoomQuestCandidateRepository candidateRepository;
    @Autowired
    private ExplorationRecordRepository recordRepository;
    @Autowired
    private UserRecentRegionRepository recentRegionRepository;
    @Autowired
    private RoomExpirationService expirationService;
    @Autowired
    private PlatformTransactionManager transactionManager;
    @Autowired
    private EntityManager entityManager;

    private record Fixture(ExplorationRoom room, RoomParticipant host, RoomParticipant member, String hostKey,
            String memberKey, InviteLink invite, List<Long> candidateIds) {
        String path(String suffix) {
            return "/api/v1/rooms/" + room.getId() + suffix;
        }
    }

    private Fixture fixture() {
        String key = UUID.randomUUID().toString();
        DeviceUser hostUser = userRepository.save(DeviceUser.create(key + "h", "방장"));
        DeviceUser memberUser = userRepository.save(DeviceUser.create(key + "m", "참여자"));
        Region region = regionRepository.save(new Region(null, "복구검증지역", "DISTRICT", 99));
        ExplorationRoom room = roomRepository.save(ExplorationRoom.create(hostUser, region, key.substring(0, 12)));
        RoomParticipant host = participantRepository.save(RoomParticipant.host(room, hostUser, "방장"));
        RoomParticipant member = participantRepository.save(RoomParticipant.member(room, memberUser, "참여자"));
        InviteLink invite = inviteRepository.save(new InviteLink(room, key));
        conditionRepository.save(new ExplorationCondition(room, ScheduleType.MEAL, TimeSlot.DINNER, DrinkingOption.ANY,
                new FoodPreferenceResponse("고수", List.of("고수"), List.of(), false, "테스트")));
        List<Long> candidates = new ArrayList<>();
        for (int index = 0; index < 3; index++) {
            Quest quest = questRepository.save(new Quest("복구 퀘스트 " + index, "설명", QuestType.COMMON, ScheduleType.MEAL));
            candidates.add(candidateRepository.save(new RoomQuestCandidate(room, quest, index + 1, "후보", 0)).getId());
        }
        return new Fixture(room, host, member, key + "h", key + "m", invite, candidates);
    }

    private ResultActions roomGet(Fixture fixture, String key, String suffix) throws Exception {
        return mockMvc.perform(get(fixture.path(suffix)).header("X-Device-Key", key));
    }

    private ResultActions roomPost(Fixture fixture, String key, String suffix) throws Exception {
        return mockMvc.perform(post(fixture.path(suffix)).header("X-Device-Key", key));
    }

    private ResultActions join(Fixture fixture, String key, String nickname) throws Exception {
        return mockMvc.perform(post("/api/v1/invites/" + fixture.invite().getToken() + "/join")
                .header("X-Device-Key", key).contentType(MediaType.APPLICATION_JSON)
                .content("{\"nickname\":\"" + nickname + "\"}"));
    }

    private void inactiveHost(Fixture fixture) {
        ReflectionTestUtils.setField(fixture.host(), "lastConnectedAt", LocalDateTime.now().minusMinutes(6));
        ReflectionTestUtils.setField(fixture.room(), "hostTakeoverAvailableAt", LocalDateTime.now().minusSeconds(1));
    }

    @Test
    void 투표후_기존참여자는_복구하고_신규참여자는_차단한다() throws Exception {
        Fixture fixture = fixture();
        roomPost(fixture, fixture.hostKey(), "/vote/start").andExpect(status().isOk());
        mockMvc.perform(post(fixture.path("/votes/me")).header("X-Device-Key", fixture.memberKey())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"candidate_ids\":[" + fixture.candidateIds().getFirst() + "]}"))
                .andExpect(status().isOk());
        join(fixture, fixture.memberKey(), "새닉네임").andExpect(status().isOk())
                .andExpect(jsonPath("$.data.restored_by_device", is(true)));
        roomGet(fixture, fixture.memberKey(), "/participants/me").andExpect(status().isOk())
                .andExpect(jsonPath("$.data.nickname", is("참여자")))
                .andExpect(jsonPath("$.data.participant_status", is("VOTING")))
                .andExpect(jsonPath("$.data.voted", is(true)))
                .andExpect(jsonPath("$.data.voted_candidate_ids[0]", is(fixture.candidateIds().getFirst().intValue())));
        mockMvc.perform(get("/api/v1/users/me/bootstrap").header("X-Device-Key", fixture.memberKey()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.has_active_room", is(true)))
                .andExpect(jsonPath("$.data.active_room_id", is(fixture.room().getId().intValue())))
                .andExpect(jsonPath("$.data.vote_restored", is(true)));
        join(fixture, UUID.randomUUID().toString(), "신규참여자").andExpect(status().isConflict())
                .andExpect(jsonPath("$.code", is("ROOM-002")));
        assertThat(participantRepository.countByRoom(fixture.room())).isEqualTo(2);
    }

    @Test
    void 정원이_가득차도_기존참여자는_복구할_수_있다() throws Exception {
        Fixture fixture = fixture();
        ReflectionTestUtils.setField(fixture.room(), "maxParticipantCount", 2);
        join(fixture, fixture.memberKey(), "같은기기").andExpect(status().isOk())
                .andExpect(jsonPath("$.data.participant_id", is(fixture.member().getId().intValue())));
        join(fixture, UUID.randomUUID().toString(), "새참여자").andExpect(status().isConflict())
                .andExpect(jsonPath("$.code", is("PARTICIPANT-002")));
    }

    @Test
    void 이탈자와_외부인은_상세와_복구와_권한이전에_접근하지_못한다() throws Exception {
        Fixture fixture = fixture();
        String outsider = UUID.randomUUID().toString();
        userRepository.save(DeviceUser.create(outsider, "외부인"));
        roomGet(fixture, outsider, "").andExpect(status().isNotFound());
        roomGet(fixture, outsider, "/participants/me").andExpect(status().isNotFound());
        roomPost(fixture, outsider, "/host/takeover").andExpect(status().isNotFound());
        ReflectionTestUtils.setField(fixture.member(), "status", ParticipantStatus.LEFT);
        roomGet(fixture, fixture.memberKey(), "/waiting-status").andExpect(status().isNotFound());
        join(fixture, fixture.memberKey(), "참여자").andExpect(status().isConflict());
    }

    @Test
    void 접속이_끊긴_방장의_권한을_이전하고_이전방장_진행을_차단한다() throws Exception {
        Fixture fixture = fixture();
        inactiveHost(fixture);
        roomGet(fixture, fixture.memberKey(), "/waiting-status").andExpect(status().isOk())
                .andExpect(jsonPath("$.data.host_disconnected", is(true)))
                .andExpect(jsonPath("$.data.can_take_over_host", is(true)))
                .andExpect(jsonPath("$.data.participants[0].connected", is(false)));
        roomPost(fixture, fixture.memberKey(), "/host/takeover").andExpect(status().isOk())
                .andExpect(jsonPath("$.data.host_participant_id", is(fixture.member().getId().intValue())));
        roomPost(fixture, fixture.memberKey(), "/host/takeover").andExpect(status().isOk());
        assertThat(fixture.host().getRole()).isEqualTo(ParticipantRole.MEMBER);
        assertThat(fixture.member().getRole()).isEqualTo(ParticipantRole.HOST);
        assertThat(fixture.room().getHostUser().getId()).isEqualTo(fixture.member().getUser().getId());
        roomPost(fixture, fixture.hostKey(), "/vote/start").andExpect(status().isForbidden());
        roomPost(fixture, fixture.memberKey(), "/vote/start").andExpect(status().isOk());
        mockMvc.perform(get("/api/v1/invites/" + fixture.invite().getToken())).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.host_nickname", is("참여자")));
    }

    @Test
    void 방장이_접속중이거나_오분이_지나지_않으면_권한을_이전하지_않는다() throws Exception {
        Fixture fixture = fixture();
        ReflectionTestUtils.setField(fixture.room(), "hostTakeoverAvailableAt", LocalDateTime.now().minusSeconds(1));
        roomGet(fixture, fixture.memberKey(), "/waiting-status").andExpect(status().isOk())
                .andExpect(jsonPath("$.data.can_take_over_host", is(false)));
        roomPost(fixture, fixture.memberKey(), "/host/takeover").andExpect(status().isConflict())
                .andExpect(jsonPath("$.code", is("ROOM-005")));
        ReflectionTestUtils.setField(fixture.host(), "lastConnectedAt", LocalDateTime.now().minusMinutes(6));
        ReflectionTestUtils.setField(fixture.room(), "hostTakeoverAvailableAt", LocalDateTime.now().plusMinutes(1));
        roomPost(fixture, fixture.memberKey(), "/host/takeover").andExpect(status().isConflict());
    }

    @Test
    void 투표현황_폴링은_접속만_갱신하고_진행액션_시간은_유지한다() throws Exception {
        Fixture fixture = fixture();
        roomPost(fixture, fixture.hostKey(), "/vote/start").andExpect(status().isOk());
        inactiveHost(fixture);
        LocalDateTime availableAt = fixture.room().getHostTakeoverAvailableAt();
        roomGet(fixture, fixture.hostKey(), "/votes/status").andExpect(status().isOk());
        roomGet(fixture, fixture.memberKey(), "/waiting-status").andExpect(status().isOk())
                .andExpect(jsonPath("$.data.host_disconnected", is(false)))
                .andExpect(jsonPath("$.data.can_take_over_host", is(false)));
        assertThat(fixture.room().getHostTakeoverAvailableAt()).isEqualTo(availableAt);
    }

    @Test
    void 방상세는_조건과_참여자상태를_반환한다() throws Exception {
        Fixture fixture = fixture();
        roomGet(fixture, fixture.memberKey(), "").andExpect(status().isOk())
                .andExpect(jsonPath("$.data.condition.schedule_type", is("MEAL")))
                .andExpect(jsonPath("$.data.condition.avoid_foods", is("고수")))
                .andExpect(jsonPath("$.data.participants", hasSize(2)))
                .andExpect(jsonPath("$.data.participants[0].status", is("WAITING")));
        candidateRepository.deleteAll(candidateRepository.findByRoomOrderByCandidateOrderAsc(fixture.room()));
        roomGet(fixture, fixture.hostKey(), "/waiting-status").andExpect(status().isOk())
                .andExpect(jsonPath("$.data.can_start_vote", is(false)));
    }

    @Test
    void 만료를_조회에_반영하고_복구가능방에서_제외한다() throws Exception {
        Fixture fixture = fixture();
        ReflectionTestUtils.setField(fixture.room(), "expiredAt", LocalDateTime.now().minusSeconds(1));
        roomGet(fixture, fixture.memberKey(), "").andExpect(status().isOk())
                .andExpect(jsonPath("$.data.room_status", is("EXPIRED")));
        entityManager.flush();
        assertThat(fixture.room().getStatus()).isEqualTo(RoomStatus.EXPIRED);
        roomGet(fixture, fixture.memberKey(), "/waiting-status").andExpect(status().isOk())
                .andExpect(jsonPath("$.data.can_take_over_host", is(false)))
                .andExpect(jsonPath("$.data.can_start_vote", is(false)));
        mockMvc.perform(get("/api/v1/users/me/bootstrap").header("X-Device-Key", fixture.memberKey()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.has_active_room", is(false)));
        mockMvc.perform(get("/api/v1/invites/" + fixture.invite().getToken())).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.unjoinable_reason", is("EXPIRED")));
        join(fixture, fixture.memberKey(), "참여자").andExpect(status().isGone());
    }

    @Test
    void 만료배치는_진행중인방만_갱신하고_종료된방은_유지한다() {
        Fixture active = fixture();
        Fixture finished = fixture();
        ReflectionTestUtils.setField(active.room(), "expiredAt", LocalDateTime.now().minusSeconds(1));
        ReflectionTestUtils.setField(finished.room(), "expiredAt", LocalDateTime.now().minusSeconds(1));
        finished.room().finishExploration();
        expirationService.expireRooms();
        assertThat(roomRepository.findById(active.room().getId()).orElseThrow().getStatus()).isEqualTo(RoomStatus.EXPIRED);
        assertThat(roomRepository.findById(finished.room().getId()).orElseThrow().getStatus()).isEqualTo(RoomStatus.FINISHED);
    }

    @Test
    void 종료된방은_초대사유를_구분하고_신규입장과_권한이전을_거부한다() throws Exception {
        Fixture fixture = fixture();
        fixture.room().finishExploration();
        mockMvc.perform(get("/api/v1/invites/" + fixture.invite().getToken())).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.unjoinable_reason", is("FINISHED")));
        join(fixture, UUID.randomUUID().toString(), "새참여자").andExpect(status().isConflict());
        roomPost(fixture, fixture.memberKey(), "/host/takeover").andExpect(status().isConflict());
    }

    @Test
    void 방생성시_최근지역을_저장하고_같은지역_재선택은_중복없이_갱신한다() throws Exception {
        Fixture fixture = fixture();
        for (int index = 0; index < 2; index++) {
            mockMvc.perform(post("/api/v1/rooms").header("X-Device-Key", fixture.hostKey())
                            .contentType(MediaType.APPLICATION_JSON).content("""
                                    {"region_id":%d,"schedule_type":"MEAL","drinking_option":"ANY"}
                                    """.formatted(fixture.room().getRegion().getId())))
                    .andExpect(status().isCreated());
        }
        assertThat(recentRegionRepository.findTop5ByUserOrderBySelectedAtDesc(fixture.host().getUser())).hasSize(1);
        mockMvc.perform(get("/api/v1/users/me/recent-regions").header("X-Device-Key", fixture.hostKey()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.recent_regions", hasSize(1)));
    }

    @Test
    void 탐험종료후_참여자는_본인기록만_조회할_수_있다() throws Exception {
        Fixture fixture = fixture();
        roomPost(fixture, fixture.hostKey(), "/vote/start").andExpect(status().isOk());
        mockMvc.perform(post(fixture.path("/votes/close")).header("X-Device-Key", fixture.hostKey())
                        .contentType(MediaType.APPLICATION_JSON).content("{\"confirmed\":true}"))
                .andExpect(status().isOk());
        String confirmed = roomPost(fixture, fixture.hostKey(), "/final-quests").andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        Number questId = JsonPath.read(confirmed, "$.data.final_quests[0].final_quest_id");
        roomPost(fixture, fixture.hostKey(), "/exploration/start").andExpect(status().isOk());
        mockMvc.perform(patch(fixture.path("/final-quests/" + questId + "/progress"))
                        .header("X-Device-Key", fixture.memberKey()).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"completed\":true}"))
                .andExpect(status().isOk());
        roomPost(fixture, fixture.hostKey(), "/exploration/finish").andExpect(status().isOk());
        String body = mockMvc.perform(get("/api/v1/users/me/records").header("X-Device-Key", fixture.memberKey()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.records", hasSize(1)))
                .andExpect(jsonPath("$.data.records[0].completed_quest_count", is(1)))
                .andReturn().getResponse().getContentAsString();
        Number id = JsonPath.read(body, "$.data.records[0].record_id");
        mockMvc.perform(get("/api/v1/records/" + id).header("X-Device-Key", fixture.memberKey()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.participants", hasSize(2)))
                .andExpect(jsonPath("$.data.completed_quests", hasSize(1)))
                .andExpect(jsonPath("$.data.photos", hasSize(0)));
        mockMvc.perform(get("/api/v1/records/" + id).header("X-Device-Key", fixture.hostKey()))
                .andExpect(status().isNotFound()).andExpect(jsonPath("$.code", is("RECORD-001")));
    }

    @Test
    void 기록목록은_같은시각에도_ID역순으로_안정적으로_페이지를_나눈다() throws Exception {
        Fixture fixture = fixture();
        LocalDateTime sameTime = LocalDateTime.now().minusHours(1);
        ExplorationRecord first = new ExplorationRecord(fixture.room(), fixture.host().getUser(), 2, 1);
        ExplorationRoom secondRoom = roomRepository.save(ExplorationRoom.create(fixture.host().getUser(),
                fixture.room().getRegion(), UUID.randomUUID().toString().substring(0, 12)));
        ExplorationRecord second = new ExplorationRecord(secondRoom, fixture.host().getUser(), 2, 2);
        ReflectionTestUtils.setField(first, "createdAt", sameTime);
        ReflectionTestUtils.setField(second, "createdAt", sameTime);
        recordRepository.saveAll(List.of(first, second));
        mockMvc.perform(get("/api/v1/users/me/records?page=0&size=1").header("X-Device-Key", fixture.hostKey()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.has_next", is(true)))
                .andExpect(jsonPath("$.data.records[0].record_id", is(second.getId().intValue())));
        mockMvc.perform(get("/api/v1/users/me/records?page=1&size=1").header("X-Device-Key", fixture.hostKey()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.has_next", is(false)))
                .andExpect(jsonPath("$.data.records[0].record_id", is(first.getId().intValue())));
        mockMvc.perform(get("/api/v1/users/me/records").header("X-Device-Key", fixture.memberKey()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.records", hasSize(0)));
    }

    @ParameterizedTest
    @CsvSource({"-1,20", "0,0", "0,101"})
    void 잘못된_기록페이지를_거부한다(int page, int size) throws Exception {
        Fixture fixture = fixture();
        mockMvc.perform(get("/api/v1/users/me/records?page=" + page + "&size=" + size)
                        .header("X-Device-Key", fixture.memberKey()))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.code", is("COMMON-001")));
    }

    @Test
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    void 마지막한자리의_동시입장은_한명만_성공한다() throws Exception {
        Fixture fixture = new TransactionTemplate(transactionManager).execute(value -> {
            Fixture created = fixture();
            ReflectionTestUtils.setField(created.room(), "maxParticipantCount", 3);
            return created;
        });
        assertThat(fixture).isNotNull();
        List<Integer> codes = race(
                () -> join(fixture, UUID.randomUUID().toString(), "새참여자1").andReturn().getResponse().getStatus(),
                () -> join(fixture, UUID.randomUUID().toString(), "새참여자2").andReturn().getResponse().getStatus());
        assertThat(codes).containsExactlyInAnyOrder(200, 409);
        assertThat(participantRepository.countByRoom(fixture.room())).isEqualTo(3);
    }

    @Test
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    void 같은기기_동시입장은_하나의_참여자를_복구한다() throws Exception {
        Fixture fixture = new TransactionTemplate(transactionManager).execute(value -> fixture());
        assertThat(fixture).isNotNull();
        String key = UUID.randomUUID().toString();
        List<Integer> codes = race(
                () -> join(fixture, key, "신규참여자").andReturn().getResponse().getStatus(),
                () -> join(fixture, key, "신규참여자").andReturn().getResponse().getStatus());
        assertThat(codes).containsOnly(200);
        assertThat(participantRepository.countByRoom(fixture.room())).isEqualTo(3);
    }

    @Test
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    void 동시_중복닉네임_입장은_한명만_성공한다() throws Exception {
        Fixture fixture = new TransactionTemplate(transactionManager).execute(value -> fixture());
        assertThat(fixture).isNotNull();
        List<Integer> codes = race(
                () -> join(fixture, UUID.randomUUID().toString(), "동일닉네임").andReturn().getResponse().getStatus(),
                () -> join(fixture, UUID.randomUUID().toString(), "동일닉네임").andReturn().getResponse().getStatus());
        assertThat(codes).containsExactlyInAnyOrder(200, 409);
        assertThat(participantRepository.countByRoom(fixture.room())).isEqualTo(3);
    }

    @Test
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    void 입장과_투표시작이_겹쳐도_시작후_신규참여자는_없다() throws Exception {
        Fixture fixture = new TransactionTemplate(transactionManager).execute(value -> fixture());
        assertThat(fixture).isNotNull();
        List<Integer> codes = race(
                () -> join(fixture, UUID.randomUUID().toString(), "신규참여자").andReturn().getResponse().getStatus(),
                () -> roomPost(fixture, fixture.hostKey(), "/vote/start").andReturn().getResponse().getStatus());
        assertThat(codes.getFirst()).isIn(200, 409);
        assertThat(codes.get(1)).isEqualTo(200);
        List<RoomParticipant> participants = participantRepository.findByRoomOrderByIdAsc(fixture.room());
        assertThat(participants).hasSize(codes.getFirst() == 200 ? 3 : 2)
                .allMatch(value -> value.getStatus() == ParticipantStatus.VOTING);
    }

    @Test
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    void 동시_권한이전은_한명의_방장만_남긴다() throws Exception {
        Fixture fixture = new TransactionTemplate(transactionManager).execute(value -> {
            Fixture created = fixture();
            inactiveHost(created);
            return created;
        });
        assertThat(fixture).isNotNull();
        String otherKey = UUID.randomUUID().toString();
        join(fixture, otherKey, "다른참여자").andExpect(status().isOk());
        List<Integer> codes = race(
                () -> roomPost(fixture, fixture.memberKey(), "/host/takeover").andReturn().getResponse().getStatus(),
                () -> roomPost(fixture, otherKey, "/host/takeover").andReturn().getResponse().getStatus());
        assertThat(codes).containsExactlyInAnyOrder(200, 409);
        assertThat(participantRepository.findByRoomOrderByIdAsc(fixture.room()))
                .filteredOn(value -> value.getRole() == ParticipantRole.HOST).hasSize(1);
    }

    private List<Integer> race(Callable<Integer> first, Callable<Integer> second) throws Exception {
        CountDownLatch ready = new CountDownLatch(2);
        CountDownLatch go = new CountDownLatch(1);
        try (var executor = Executors.newFixedThreadPool(2)) {
            var tasks = List.of(first, second).stream().map(action -> executor.submit(() -> {
                ready.countDown();
                if (!go.await(10, TimeUnit.SECONDS)) {
                    throw new IllegalStateException("동시 요청 시작 시간이 초과되었습니다.");
                }
                return action.call();
            })).toList();
            try {
                assertThat(ready.await(10, TimeUnit.SECONDS)).isTrue();
            } finally {
                go.countDown();
            }
            return List.of(tasks.getFirst().get(20, TimeUnit.SECONDS), tasks.get(1).get(20, TimeUnit.SECONDS));
        }
    }
}
