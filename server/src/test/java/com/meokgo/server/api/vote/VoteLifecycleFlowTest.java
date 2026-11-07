package com.meokgo.server.api.vote;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.meokgo.server.domain.quest.domain.FinalQuest;
import com.meokgo.server.domain.quest.domain.FinalQuestSelectionReason;
import com.meokgo.server.domain.quest.domain.Quest;
import com.meokgo.server.domain.quest.domain.QuestType;
import com.meokgo.server.domain.quest.domain.RoomQuestCandidate;
import com.meokgo.server.domain.quest.repository.FinalQuestRepository;
import com.meokgo.server.domain.quest.repository.QuestRepository;
import com.meokgo.server.domain.quest.repository.RoomQuestCandidateRepository;
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
import com.meokgo.server.domain.vote.domain.Vote;
import com.meokgo.server.domain.vote.domain.VoteStatus;
import com.meokgo.server.domain.vote.repository.VoteItemRepository;
import com.meokgo.server.domain.vote.repository.VoteRepository;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest(properties = "spring.datasource.url=jdbc:h2:mem:vote_lifecycle_test;MODE=MySQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1")
@AutoConfigureMockMvc
@Transactional
class VoteLifecycleFlowTest {

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private QuestRepository questRepository;
    @Autowired
    private RoomQuestCandidateRepository candidateRepository;
    @Autowired
    private RegionRepository regionRepository;
    @Autowired
    private ExplorationRoomRepository roomRepository;
    @Autowired
    private RoomParticipantRepository participantRepository;
    @Autowired
    private DeviceUserRepository userRepository;
    @Autowired
    private VoteRepository voteRepository;
    @Autowired
    private VoteItemRepository voteItemRepository;
    @Autowired
    private FinalQuestRepository finalQuestRepository;

    private record Fixture(ExplorationRoom room, Vote vote, RoomParticipant host,
            RoomParticipant member, List<Long> ids) {
        String path(String suffix) {
            return "/api/v1/rooms/" + room.getId() + suffix;
        }
    }

    private Fixture fixture(int count) {
        DeviceUser hostUser = userRepository.save(DeviceUser.create("lifecycle-host", "방장"));
        DeviceUser memberUser = userRepository.save(DeviceUser.create("lifecycle-member", "참여자"));
        Region region = regionRepository.save(new Region(null, "투표검증지역", "DISTRICT", 99));
        ExplorationRoom room = roomRepository.save(ExplorationRoom.create(hostUser, region, "LIFECYCLE"));
        RoomParticipant host = participantRepository.save(RoomParticipant.host(room, hostUser, "방장"));
        RoomParticipant member = participantRepository.save(RoomParticipant.member(room, memberUser, "참여자"));
        room.startVote();
        host.startVoting();
        member.startVoting();
        Vote vote = voteRepository.save(new Vote(room));
        List<Long> ids = new ArrayList<>();
        for (int index = 0; index < count; index++) {
            Quest quest = questRepository.save(new Quest("후보 " + index, "후보 설명", QuestType.COMMON, ScheduleType.MEAL));
            ids.add(candidateRepository.save(new RoomQuestCandidate(room, quest, index + 1, "테스트 후보", 0)).getId());
        }
        return new Fixture(room, vote, host, member, ids);
    }

    private ResultActions vote(Fixture fixture, String device, List<Long> ids) throws Exception {
        return mockMvc.perform(post(fixture.path("/votes/me")).header("X-Device-Key", device)
                .contentType(MediaType.APPLICATION_JSON).content("{\"candidate_ids\":" + ids + "}"));
    }

    private ResultActions close(Fixture fixture, String device, String body) throws Exception {
        return mockMvc.perform(post(fixture.path("/votes/close")).header("X-Device-Key", device)
                .contentType(MediaType.APPLICATION_JSON).content(body));
    }

    private ResultActions tieBreak(Fixture fixture, List<Long> ids) throws Exception {
        return mockMvc.perform(post(fixture.path("/final-quests/tie-break"))
                .header("X-Device-Key", "lifecycle-host").contentType(MediaType.APPLICATION_JSON)
                .content("{\"selected_candidate_ids\":" + ids + "}"));
    }

    private ResultActions confirm(Fixture fixture) throws Exception {
        return mockMvc.perform(post(fixture.path("/final-quests")).header("X-Device-Key", "lifecycle-host"));
    }

    private void boundaryTie(Fixture fixture) throws Exception {
        vote(fixture, "lifecycle-host", fixture.ids().subList(0, 3)).andExpect(status().isOk());
        vote(fixture, "lifecycle-member", List.of(fixture.ids().get(0), fixture.ids().get(3), fixture.ids().get(4)))
                .andExpect(status().isOk());
        close(fixture, "lifecycle-host", "{\"confirmed\":true}").andExpect(status().isOk());
    }

    @Test
    void 투표_현황은_참여자별_제출과_본인_선택개수를_반환한다() throws Exception {
        Fixture fixture = fixture(6);
        vote(fixture, "lifecycle-host", fixture.ids().subList(0, 3)).andExpect(status().isOk());
        mockMvc.perform(get(fixture.path("/votes/status")).header("X-Device-Key", "lifecycle-host"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.total_participant_count", is(2)))
                .andExpect(jsonPath("$.data.voted_participant_count", is(1)))
                .andExpect(jsonPath("$.data.selected_count", is(3)))
                .andExpect(jsonPath("$.data.vote_status_text", is("2명 중 1명 투표 완료")))
                .andExpect(jsonPath("$.data.push_notification_enabled", is(false)))
                .andExpect(jsonPath("$.data.candidate_results", hasSize(6)))
                .andExpect(jsonPath("$.data.candidate_results[0].vote_count", is(1)));
        mockMvc.perform(get(fixture.path("/votes/close-preview")).header("X-Device-Key", "lifecycle-host"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.not_voted_participant_count", is(1)))
                .andExpect(jsonPath("$.data.confirmation_required", is(true)))
                .andExpect(jsonPath("$.data.top_candidates", hasSize(3)));
    }

    @ParameterizedTest
    @ValueSource(strings = {"{}", "{\"confirmed\":false}", "{\"confirmed\":null}"})
    void 확인값이_없거나_거짓이면_투표를_마감하지_않는다(String body) throws Exception {
        Fixture fixture = fixture(6);
        close(fixture, "lifecycle-host", body).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code", is("VOTE-003")));
        assertThat(fixture.vote().getStatus()).isEqualTo(VoteStatus.OPEN);
        assertThat(fixture.room().getStatus()).isEqualTo(RoomStatus.VOTING);
    }

    @Test
    void 미투표자가_있어도_확인후_마감하고_마감시점_정보를_저장한다() throws Exception {
        Fixture fixture = fixture(6);
        close(fixture, "lifecycle-host", "{\"confirmed\":true}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.room_status", is("VOTE_CLOSED")))
                .andExpect(jsonPath("$.data.not_voted_participant_count", is(2)));
        assertThat(fixture.vote().getNotVotedCountAtClose()).isEqualTo(2);
        assertThat(fixture.vote().isCloseConfirmed()).isTrue();
        assertThat(fixture.vote().getClosedAt()).isNotNull();
        vote(fixture, "lifecycle-member", fixture.ids().subList(0, 1))
                .andExpect(status().isConflict()).andExpect(jsonPath("$.code", is("VOTE-001")));
        mockMvc.perform(put(fixture.path("/votes/me")).header("X-Device-Key", "lifecycle-host")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"candidate_ids\":" + fixture.ids().subList(0, 1) + "}"))
                .andExpect(status().isConflict()).andExpect(jsonPath("$.code", is("VOTE-001")));
        close(fixture, "lifecycle-host", "{\"confirmed\":true}")
                .andExpect(status().isConflict()).andExpect(jsonPath("$.code", is("VOTE-001")));
    }

    @Test
    void 투표_수정은_중복없이_선택과_득표수를_갱신한다() throws Exception {
        Fixture fixture = fixture(6);
        vote(fixture, "lifecycle-host", fixture.ids().subList(0, 3)).andExpect(status().isOk());
        List<Long> changed = fixture.ids().subList(1, 4);
        for (int index = 0; index < 2; index++) {
            mockMvc.perform(put(fixture.path("/votes/me")).header("X-Device-Key", "lifecycle-host")
                            .contentType(MediaType.APPLICATION_JSON).content("{\"candidate_ids\":" + changed + "}"))
                    .andExpect(status().isOk());
        }
        assertThat(voteItemRepository.findByVoteAndParticipant(fixture.vote(), fixture.host()))
                .extracting(item -> item.getCandidate().getId()).containsExactlyInAnyOrderElementsOf(changed);
        assertThat(voteItemRepository.countByVoteAndCandidateId(fixture.vote(), fixture.ids().get(0))).isZero();
        vote(fixture, "lifecycle-host", List.of(fixture.ids().get(1), fixture.ids().get(1)))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.code", is("VOTE-002")));
    }

    @Test
    void 마감과_최종선택은_방장만_가능하다() throws Exception {
        Fixture fixture = fixture(6);
        mockMvc.perform(get(fixture.path("/votes/close-preview")).header("X-Device-Key", "lifecycle-member"))
                .andExpect(status().isForbidden());
        close(fixture, "lifecycle-member", "{\"confirmed\":true}").andExpect(status().isForbidden());
        close(fixture, "lifecycle-host", "{\"confirmed\":true}").andExpect(status().isOk());
        mockMvc.perform(post(fixture.path("/final-quests/tie-break")).header("X-Device-Key", "lifecycle-member")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"selected_candidate_ids\":" + fixture.ids().subList(0, 3) + "}"))
                .andExpect(status().isForbidden());
        mockMvc.perform(post(fixture.path("/final-quests")).header("X-Device-Key", "lifecycle-member"))
                .andExpect(status().isForbidden());
    }

    @Test
    void 외부인과_이탈참여자는_투표정보에_접근하지_못한다() throws Exception {
        Fixture fixture = fixture(6);
        userRepository.save(DeviceUser.create("lifecycle-outsider", "외부인"));
        mockMvc.perform(get(fixture.path("/votes/status")).header("X-Device-Key", "lifecycle-outsider"))
                .andExpect(status().isNotFound()).andExpect(jsonPath("$.code", is("PARTICIPANT-001")));
        vote(fixture, "lifecycle-member", fixture.ids().subList(0, 1)).andExpect(status().isOk());
        ReflectionTestUtils.setField(fixture.member(), "status", ParticipantStatus.LEFT);
        mockMvc.perform(get(fixture.path("/votes/status")).header("X-Device-Key", "lifecycle-member"))
                .andExpect(status().isNotFound());
        mockMvc.perform(get(fixture.path("/votes/status")).header("X-Device-Key", "lifecycle-host"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.total_participant_count", is(1)))
                .andExpect(jsonPath("$.data.voted_participant_count", is(0)))
                .andExpect(jsonPath("$.data.candidate_results[0].vote_count", is(0)));
    }

    @Test
    void 마감전에는_최종_퀘스트를_확정하지_못한다() throws Exception {
        Fixture fixture = fixture(6);
        confirm(fixture).andExpect(status().isConflict()).andExpect(jsonPath("$.code", is("ROOM-003")));
        mockMvc.perform(get(fixture.path("/final-quests/preview")).header("X-Device-Key", "lifecycle-host"))
                .andExpect(status().isConflict());
        assertThat(finalQuestRepository.findByRoomOrderByRankNoAsc(fixture.room())).isEmpty();
    }

    @Test
    void 상위권_내부동점은_선정대상이_정해졌으면_선택없이_확정한다() throws Exception {
        Fixture fixture = fixture(6);
        vote(fixture, "lifecycle-host", fixture.ids().subList(0, 3)).andExpect(status().isOk());
        vote(fixture, "lifecycle-member", fixture.ids().subList(0, 2)).andExpect(status().isOk());
        close(fixture, "lifecycle-host", "{\"confirmed\":true}").andExpect(status().isOk());
        mockMvc.perform(get(fixture.path("/final-quests/preview")).header("X-Device-Key", "lifecycle-member"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.tie_break_required", is(false)))
                .andExpect(jsonPath("$.data.auto_confirmable", is(true)))
                .andExpect(jsonPath("$.data.final_quest_candidates", hasSize(3)));
        confirm(fixture).andExpect(status().isOk()).andExpect(jsonPath("$.data.room_status", is("QUEST_CONFIRMED")))
                .andExpect(jsonPath("$.data.final_quests", hasSize(3)));
        List<FinalQuest> first = finalQuestRepository.findByRoomOrderByRankNoAsc(fixture.room());
        assertThat(first).extracting(FinalQuest::getSelectionReason).containsOnly(FinalQuestSelectionReason.VOTE_RANK);
        assertThat(first).extracting(value -> value.getCandidate().getId()).containsExactlyElementsOf(fixture.ids().subList(0, 3));
        assertThat(fixture.host().getStatus()).isEqualTo(ParticipantStatus.READY);
        assertThat(fixture.member().getStatus()).isEqualTo(ParticipantStatus.READY);
        List<Long> ids = first.stream().map(FinalQuest::getId).toList();
        confirm(fixture).andExpect(status().isOk());
        assertThat(finalQuestRepository.findByRoomOrderByRankNoAsc(fixture.room()))
                .extracting(FinalQuest::getId).containsExactlyElementsOf(ids);
        tieBreak(fixture, fixture.ids().subList(0, 3)).andExpect(status().isConflict());
    }

    @Test
    void 선정경계_동점은_필요개수만_선택하고_별도_확정한다() throws Exception {
        Fixture fixture = fixture(6);
        boundaryTie(fixture);
        mockMvc.perform(get(fixture.path("/final-quests/preview")).header("X-Device-Key", "lifecycle-host"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.tie_break_required", is(true)))
                .andExpect(jsonPath("$.data.tie_groups[0].required_select_count", is(2)))
                .andExpect(jsonPath("$.data.tie_groups[0].candidates", hasSize(4)));
        confirm(fixture).andExpect(status().isConflict()).andExpect(jsonPath("$.code", is("FINAL-001")));
        tieBreak(fixture, List.of(fixture.ids().get(4), fixture.ids().get(1))).andExpect(status().isOk());
        assertThat(finalQuestRepository.findByRoomOrderByRankNoAsc(fixture.room())).isEmpty();
        mockMvc.perform(get(fixture.path("/final-quests/preview")).header("X-Device-Key", "lifecycle-host"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.tie_break_required", is(false)));
        confirm(fixture).andExpect(status().isOk());
        List<FinalQuest> selected = finalQuestRepository.findByRoomOrderByRankNoAsc(fixture.room());
        assertThat(selected).extracting(value -> value.getCandidate().getId())
                .containsExactly(fixture.ids().get(0), fixture.ids().get(4), fixture.ids().get(1));
        assertThat(selected).extracting(FinalQuest::getSelectionReason)
                .containsExactly(FinalQuestSelectionReason.VOTE_RANK, FinalQuestSelectionReason.HOST_TIE_BREAK,
                        FinalQuestSelectionReason.HOST_TIE_BREAK);
        assertThat(selected.get(1).getSelectedByHost()).isEqualTo(fixture.host());
    }

    @Test
    void 동점선택_개수_중복_비대상후보를_거부한다() throws Exception {
        Fixture fixture = fixture(6);
        boundaryTie(fixture);
        for (List<Long> invalid : List.of(List.of(fixture.ids().get(1)),
                List.of(fixture.ids().get(1), fixture.ids().get(1)),
                List.of(fixture.ids().get(0), fixture.ids().get(1)),
                List.of(fixture.ids().get(1), Long.MAX_VALUE))) {
            tieBreak(fixture, invalid).andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.code", is("COMMON-001")));
        }
        assertThat(fixture.vote().getTieBreakCandidateIds()).isEmpty();
    }

    @Test
    void 모두_영표이면_방장이_세개를_선택한다() throws Exception {
        Fixture fixture = fixture(6);
        close(fixture, "lifecycle-host", "{\"confirmed\":true}").andExpect(status().isOk());
        mockMvc.perform(get(fixture.path("/final-quests/preview")).header("X-Device-Key", "lifecycle-host"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.tie_groups[0].required_select_count", is(3)))
                .andExpect(jsonPath("$.data.tie_groups[0].candidates", hasSize(6)));
        tieBreak(fixture, fixture.ids().subList(3, 6)).andExpect(status().isOk());
        confirm(fixture).andExpect(status().isOk());
        assertThat(finalQuestRepository.findByRoomOrderByRankNoAsc(fixture.room()))
                .extracting(FinalQuest::getVoteCount).containsOnly(0L);
    }

    @Test
    void 후보가_정확히_세개이면_영표여도_동점선택이_필요없다() throws Exception {
        Fixture fixture = fixture(3);
        close(fixture, "lifecycle-host", "{\"confirmed\":true}").andExpect(status().isOk());
        confirm(fixture).andExpect(status().isOk()).andExpect(jsonPath("$.data.final_quests", hasSize(3)));
    }

    @Test
    void 만료된_방의_투표_상태를_변경하지_않는다() throws Exception {
        Fixture fixture = fixture(6);
        ReflectionTestUtils.setField(fixture.room(), "expiredAt", LocalDateTime.now().minusSeconds(1));
        close(fixture, "lifecycle-host", "{\"confirmed\":true}")
                .andExpect(status().isConflict()).andExpect(jsonPath("$.code", is("ROOM-003")));
        assertThat(fixture.vote().getStatus()).isEqualTo(VoteStatus.OPEN);
    }
}
