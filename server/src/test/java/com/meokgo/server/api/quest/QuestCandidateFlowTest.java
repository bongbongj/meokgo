package com.meokgo.server.api.quest;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.meokgo.server.domain.food.service.FoodPreferenceService;
import com.meokgo.server.domain.quest.domain.Quest;
import com.meokgo.server.domain.quest.domain.QuestType;
import com.meokgo.server.domain.quest.domain.RoomQuestCandidate;
import com.meokgo.server.domain.quest.domain.UserQuestHistory;
import com.meokgo.server.domain.quest.repository.QuestRepository;
import com.meokgo.server.domain.quest.repository.RoomQuestCandidateRepository;
import com.meokgo.server.domain.quest.repository.UserQuestHistoryRepository;
import com.meokgo.server.domain.region.domain.Region;
import com.meokgo.server.domain.region.repository.RegionRepository;
import com.meokgo.server.domain.room.domain.DrinkingOption;
import com.meokgo.server.domain.room.domain.ExplorationCondition;
import com.meokgo.server.domain.room.domain.ExplorationRoom;
import com.meokgo.server.domain.room.domain.ParticipantStatus;
import com.meokgo.server.domain.room.domain.RoomParticipant;
import com.meokgo.server.domain.room.domain.ScheduleType;
import com.meokgo.server.domain.room.domain.TimeSlot;
import com.meokgo.server.domain.room.repository.ExplorationConditionRepository;
import com.meokgo.server.domain.room.repository.ExplorationRoomRepository;
import com.meokgo.server.domain.room.repository.RoomParticipantRepository;
import com.meokgo.server.domain.user.domain.DeviceUser;
import com.meokgo.server.domain.user.repository.DeviceUserRepository;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest(properties = "spring.datasource.url=jdbc:h2:mem:quest_selection_test;MODE=MySQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1")
@AutoConfigureMockMvc
@Transactional
class QuestCandidateFlowTest {

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private QuestRepository questRepository;
    @Autowired
    private RoomQuestCandidateRepository candidateRepository;
    @Autowired
    private UserQuestHistoryRepository historyRepository;
    @Autowired
    private RegionRepository regionRepository;
    @Autowired
    private ExplorationRoomRepository roomRepository;
    @Autowired
    private RoomParticipantRepository participantRepository;
    @Autowired
    private DeviceUserRepository userRepository;
    @Autowired
    private ExplorationConditionRepository conditionRepository;
    @Autowired
    private FoodPreferenceService preferenceService;

    private ExplorationRoom room(DrinkingOption drinking, TimeSlot time, String avoid) {
        DeviceUser host = userRepository.save(DeviceUser.create("candidate-host", "방장"));
        Region region = regionRepository.save(new Region(null, "추가지역", "DISTRICT", 99));
        ExplorationRoom room = roomRepository.save(ExplorationRoom.create(host, region, "TEST-CANDIDATE"));
        participantRepository.save(RoomParticipant.host(room, host, "방장"));
        conditionRepository.save(new ExplorationCondition(room, ScheduleType.PUB, time,
                drinking, preferenceService.requireResolved(avoid)));
        return room;
    }

    private Quest quest(String title, TimeSlot time, DrinkingOption drinking, List<String> required) {
        return questRepository.save(new Quest(title, "테스트 퀘스트 설명", QuestType.COMMON,
                ScheduleType.PUB, time, drinking, required, required));
    }

    private void generate(ExplorationRoom room) throws Exception {
        mockMvc.perform(post("/api/v1/rooms/{roomId}/quest-candidates", room.getId())
                        .header("X-Device-Key", "candidate-host"))
                .andExpect(status().isOk());
    }

    @Test
    void 일정_시간_음주_음식_조건을_반영하고_일반_퀘스트는_유지한다() throws Exception {
        questRepository.deleteAll();
        ExplorationRoom room = room(DrinkingOption.NONE, TimeSlot.DINNER, "해산물");
        for (int index = 0; index < 3; index++) {
            quest("일반 후보 " + index, TimeSlot.ANY, DrinkingOption.ANY, List.of());
        }
        quest("음주 필수", TimeSlot.ANY, DrinkingOption.AVAILABLE, List.of());
        quest("점심 전용", TimeSlot.LUNCH, DrinkingOption.NONE, List.of());
        quest("새우 필수", TimeSlot.ANY, DrinkingOption.NONE, List.of("새우"));
        Quest inactive = quest("비활성 후보", TimeSlot.ANY, DrinkingOption.NONE, List.of());
        ReflectionTestUtils.setField(inactive, "active", false);
        questRepository.save(new Quest("다른 일정", "설명", QuestType.COMMON, ScheduleType.CAFE));
        mockMvc.perform(post("/api/v1/rooms/{roomId}/quest-candidates", room.getId())
                        .header("X-Device-Key", "candidate-host"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.candidate_count", is(3)))
                .andExpect(jsonPath("$.data.filled_with_history_quest", is(false)));
        assertThat(candidateRepository.findByRoomOrderByCandidateOrderAsc(room))
                .allSatisfy(candidate -> assertThat(candidate.getQuest().getTitle()).startsWith("일반 후보"));
    }

    @Test
    void 음주_가능에서도_비음주와_음주_후보를_함께_제공한다() throws Exception {
        questRepository.deleteAll();
        ExplorationRoom room = room(DrinkingOption.AVAILABLE, TimeSlot.ANY, "");
        quest("음주", TimeSlot.ANY, DrinkingOption.AVAILABLE, List.of());
        quest("비음주", TimeSlot.ANY, DrinkingOption.NONE, List.of());
        quest("무관", null, null, List.of());
        generate(room);
        assertThat(candidateRepository.findByRoomOrderByCandidateOrderAsc(room))
                .extracting(candidate -> candidate.getQuest().getTitle()).containsExactlyInAnyOrder("음주", "비음주", "무관");
    }

    @Test
    void 전체_참여자_완료_경험자가_적은_순서로_선정하고_결과를_유지한다() throws Exception {
        questRepository.deleteAll();
        ExplorationRoom room = room(DrinkingOption.ANY, TimeSlot.ANY, null);
        DeviceUser host = room.getHostUser();
        DeviceUser member = userRepository.save(DeviceUser.create("candidate-member", "참여자"));
        DeviceUser leftUser = userRepository.save(DeviceUser.create("candidate-left", "이탈자"));
        RoomParticipant left = RoomParticipant.member(room, leftUser, "이탈자");
        ReflectionTestUtils.setField(left, "status", ParticipantStatus.LEFT);
        participantRepository.save(left);
        DeviceUser outsider = userRepository.save(DeviceUser.create("candidate-outsider", "외부인"));
        participantRepository.save(RoomParticipant.member(room, member, "참여자"));
        List<Quest> quests = new ArrayList<>();
        for (int index = 0; index < 8; index++) {
            quests.add(quest("후보 " + index, TimeSlot.ANY, DrinkingOption.ANY, List.of()));
        }
        for (int index = 4; index < 8; index++) {
            historyRepository.save(new UserQuestHistory(member, quests.get(index), room, LocalDateTime.now()));
        }
        historyRepository.save(new UserQuestHistory(member, quests.get(4), room, LocalDateTime.now()));
        historyRepository.save(new UserQuestHistory(host, quests.get(7), room, LocalDateTime.now()));
        historyRepository.save(new UserQuestHistory(outsider, quests.get(0), room, LocalDateTime.now()));
        historyRepository.save(new UserQuestHistory(leftUser, quests.get(1), room, LocalDateTime.now()));
        generate(room);
        List<RoomQuestCandidate> first = candidateRepository.findByRoomOrderByCandidateOrderAsc(room);
        assertThat(first).hasSize(6);
        assertThat(first).extracting(RoomQuestCandidate::getCompletedParticipantCount).containsExactly(0, 0, 0, 0, 1, 1);
        assertThat(first).extracting(candidate -> candidate.getQuest().getId()).doesNotHaveDuplicates();
        assertThat(first).noneSatisfy(candidate -> assertThat(candidate.getQuest().getId()).isEqualTo(quests.get(7).getId()));
        List<Long> candidateIds = first.stream().map(RoomQuestCandidate::getId).toList();
        historyRepository.save(new UserQuestHistory(host, quests.get(0), room, LocalDateTime.now()));
        mockMvc.perform(post("/api/v1/rooms/{roomId}/quest-candidates", room.getId())
                        .header("X-Device-Key", "candidate-host"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.filled_with_history_quest", is(true)))
                .andExpect(jsonPath("$.data.candidates", hasSize(6)));
        mockMvc.perform(get("/api/v1/rooms/{roomId}/quest-candidates", room.getId())
                        .header("X-Device-Key", "candidate-member"))
                .andExpect(status().isOk());
        assertThat(candidateRepository.findByRoomOrderByCandidateOrderAsc(room))
                .extracting(RoomQuestCandidate::getId).containsExactlyElementsOf(candidateIds);
    }

    @Test
    void 후보가_세개_미만이면_저장하지_않고_오류를_반환한다() throws Exception {
        questRepository.deleteAll();
        ExplorationRoom room = room(DrinkingOption.NONE, TimeSlot.ANY, null);
        quest("후보 하나", TimeSlot.ANY, DrinkingOption.NONE, List.of());
        quest("음주 제외", TimeSlot.ANY, DrinkingOption.AVAILABLE, List.of());
        mockMvc.perform(post("/api/v1/rooms/{roomId}/quest-candidates", room.getId())
                        .header("X-Device-Key", "candidate-host"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code", is("QUEST-003")));
        assertThat(candidateRepository.findByRoomOrderByCandidateOrderAsc(room)).isEmpty();
    }

    @Test
    void 외부인은_후보를_조회하거나_생성할_수_없다() throws Exception {
        ExplorationRoom room = room(DrinkingOption.NONE, TimeSlot.ANY, null);
        mockMvc.perform(post("/api/v1/rooms/{roomId}/quest-candidates", room.getId())
                        .header("X-Device-Key", "unknown-device"))
                .andExpect(status().isNotFound());
        mockMvc.perform(get("/api/v1/rooms/{roomId}/quest-candidates", room.getId())
                        .header("X-Device-Key", "unknown-device"))
                .andExpect(status().isNotFound());
    }

    @Test
    void 미인식_기피_음식은_방을_생성하지_않고_필드_오류를_반환한다() throws Exception {
        Region region = regionRepository.save(new Region(null, "검증지역", "DISTRICT", 99));
        long before = roomRepository.count();
        mockMvc.perform(post("/api/v1/rooms")
                        .header("X-Device-Key", "invalid-food-host")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"region_id": %d, "schedule_type": "MEAL", "drinking_option": "NONE",
                                 "avoid_foods": "정체불명음식"}
                                """.formatted(region.getId())))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code", is("COMMON-001")))
                .andExpect(jsonPath("$.errors[0].field", is("avoid_foods")));
        assertThat(roomRepository.count()).isEqualTo(before);
    }

    @Test
    void 참여자는_조회할_수_있지만_후보_생성은_방장만_가능하다() throws Exception {
        ExplorationRoom room = room(DrinkingOption.ANY, TimeSlot.ANY, null);
        DeviceUser member = userRepository.save(DeviceUser.create("candidate-member", "참여자"));
        participantRepository.save(RoomParticipant.member(room, member, "참여자"));
        mockMvc.perform(post("/api/v1/rooms/{roomId}/quest-candidates", room.getId())
                        .header("X-Device-Key", "candidate-member"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code", is("ROOM-004")));
    }

    @Test
    void 방_생성시_원문과_해석결과를_함께_저장한다() throws Exception {
        Region region = regionRepository.save(new Region(null, "자유입력지역", "DISTRICT", 99));
        mockMvc.perform(post("/api/v1/rooms")
                        .header("X-Device-Key", "resolved-food-host")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"region_id": %d, "schedule_type": "MEAL", "drinking_option": "NONE",
                                 "avoid_foods": "새우는 괜찮고 고수는 싫어요"}
                                """.formatted(region.getId())))
                .andExpect(status().isCreated());
        ExplorationCondition condition = conditionRepository.findAll().stream()
                .filter(value -> "새우는 괜찮고 고수는 싫어요".equals(value.getAvoidFoods())).findFirst().orElseThrow();
        assertThat(condition.getRecognizedAvoidKeywords()).containsExactly("고수");
        assertThat(condition.getDictionaryVersion()).isEqualTo("1");
    }
}
