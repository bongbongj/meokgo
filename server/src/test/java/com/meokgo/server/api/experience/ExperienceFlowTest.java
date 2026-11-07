package com.meokgo.server.api.experience;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.meokgo.server.domain.exploration.domain.QuestProgress;
import com.meokgo.server.domain.exploration.repository.QuestProgressRepository;
import com.meokgo.server.domain.quest.domain.FinalQuest;
import com.meokgo.server.domain.quest.domain.Quest;
import com.meokgo.server.domain.quest.domain.QuestType;
import com.meokgo.server.domain.quest.domain.RoomQuestCandidate;
import com.meokgo.server.domain.quest.domain.UserQuestHistory;
import com.meokgo.server.domain.quest.repository.FinalQuestRepository;
import com.meokgo.server.domain.quest.repository.QuestRepository;
import com.meokgo.server.domain.quest.repository.RoomQuestCandidateRepository;
import com.meokgo.server.domain.quest.repository.UserQuestHistoryRepository;
import com.meokgo.server.domain.record.domain.ExplorationRecord;
import com.meokgo.server.domain.record.repository.ExplorationRecordRepository;
import com.meokgo.server.domain.region.domain.Region;
import com.meokgo.server.domain.region.repository.RegionRepository;
import com.meokgo.server.domain.retention.repository.UserRetentionStageRepository;
import com.meokgo.server.domain.retention.service.RetentionService;
import com.meokgo.server.domain.room.domain.ExplorationRoom;
import com.meokgo.server.domain.room.domain.RoomParticipant;
import com.meokgo.server.domain.room.domain.ScheduleType;
import com.meokgo.server.domain.room.repository.ExplorationRoomRepository;
import com.meokgo.server.domain.room.repository.RoomParticipantRepository;
import com.meokgo.server.domain.story.domain.RecordPhoto;
import com.meokgo.server.domain.story.domain.StoryImage;
import com.meokgo.server.domain.story.repository.RecordPhotoRepository;
import com.meokgo.server.domain.story.repository.StoryImageRepository;
import com.meokgo.server.domain.story.repository.StoryTemplateRepository;
import com.meokgo.server.domain.story.service.ExpiredImageCleanup;
import com.meokgo.server.domain.story.service.ImageStorage;
import com.meokgo.server.domain.story.service.StoryImageRenderer;
import com.meokgo.server.domain.user.domain.DeviceUser;
import com.meokgo.server.domain.user.repository.DeviceUserRepository;
import jakarta.persistence.EntityManager;
import java.awt.Color;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.ArrayList;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;
import javax.imageio.ImageIO;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

/**
 * 홈·통계·리텐션과 개인 사진 업로드부터 이미지 생성·만료까지의 흐름을 검증한다.
 *
 * @author 정효림
 */
@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:experience_test;MODE=MySQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1",
        "app.storage.local-root=./build/experience-images",
        "app.storage.cleanup-initial-delay-ms=86400000"
})
@AutoConfigureMockMvc
@Transactional
class ExperienceFlowTest {
    @Autowired private MockMvc mvc;
    @Autowired private DeviceUserRepository users;
    @Autowired private RegionRepository regions;
    @Autowired private ExplorationRoomRepository rooms;
    @Autowired private RoomParticipantRepository participants;
    @Autowired private ExplorationRecordRepository records;
    @Autowired private QuestRepository quests;
    @Autowired private RoomQuestCandidateRepository candidates;
    @Autowired private FinalQuestRepository finalQuests;
    @Autowired private QuestProgressRepository progress;
    @Autowired private UserQuestHistoryRepository history;
    @Autowired private UserRetentionStageRepository achievements;
    @Autowired private RetentionService retention;
    @Autowired private RecordPhotoRepository photos;
    @Autowired private StoryImageRepository images;
    @Autowired private StoryTemplateRepository templates;
    @Autowired private ImageStorage storage;
    @Autowired private StoryImageRenderer renderer;
    @Autowired private ExpiredImageCleanup cleanup;
    @Autowired private EntityManager entityManager;
    @Autowired private PlatformTransactionManager transactionManager;

    private record Fixture(DeviceUser user, Region region, ExplorationRoom room, ExplorationRecord record) {
        String path() {
            return "/api/v1/records/" + record.getId();
        }
        String key() {
            return user.getDeviceKey();
        }
    }

    private Fixture fixture() {
        String key = UUID.randomUUID().toString();
        DeviceUser user = users.save(DeviceUser.create(key, "탐험가"));
        Region region = regions.save(new Region(null, "검증지역", "DISTRICT", 99));
        ExplorationRoom room = rooms.save(ExplorationRoom.create(user, region, key.substring(0, 12)));
        participants.save(RoomParticipant.host(room, user, "탐험가"));
        room.finishExploration();
        ExplorationRecord record = records.save(new ExplorationRecord(room, user, 1, 0));
        return new Fixture(user, region, room, record);
    }

    private MockMultipartFile photo() throws Exception {
        BufferedImage image = new BufferedImage(120, 90, BufferedImage.TYPE_INT_RGB);
        var graphics = image.createGraphics();
        graphics.setColor(new Color(221, 154, 84));
        graphics.fillRect(0, 0, 120, 90);
        graphics.dispose();
        ByteArrayOutputStream bytes = new ByteArrayOutputStream();
        ImageIO.write(image, "png", bytes);
        return new MockMultipartFile("photos", "../사진.png", "image/png", bytes.toByteArray());
    }

    private RecordPhoto upload(Fixture fixture) throws Exception {
        mvc.perform(multipart(fixture.path() + "/photos").file(photo()).header("X-Device-Key", fixture.key()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.photos", hasSize(1)));
        entityManager.flush();
        return photos.findByRecordAndDeletedFalseAndExpiredAtAfterOrderByPhotoOrderAsc(
                fixture.record(), LocalDateTime.now()).getLast();
    }

    private String body(Long photoId) {
        Long templateId = templates.findByActiveTrueOrderByDisplayOrderAscIdAsc().getFirst().getId();
        return "{\"template_id\":" + templateId + ",\"photo_ids\":[" + photoId + "],\"memo\":\"함께 발견한 하루\"}";
    }

    private StoryImage generate(Fixture fixture, RecordPhoto photo) throws Exception {
        mvc.perform(post(fixture.path() + "/story-image").header("X-Device-Key", fixture.key())
                .contentType(MediaType.APPLICATION_JSON).content(body(photo.getId())))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.image_ratio", is("9:16")))
                .andExpect(jsonPath("$.data.storage_provider", is("LOCAL")));
        return images.findAll().stream().filter(value -> value.getRecord().getId().equals(fixture.record().getId()))
                .findFirst().orElseThrow();
    }

    @Test
    void 신규사용자는_빈홈과_영통계를_받고_미등록사용자는_거부한다() throws Exception {
        String key = UUID.randomUUID().toString();
        users.save(DeviceUser.create(key, "처음"));
        mvc.perform(get("/api/v1/home").header("X-Device-Key", key)).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.active_room", nullValue()))
                .andExpect(jsonPath("$.data.recent_records", hasSize(0)))
                .andExpect(jsonPath("$.data.retention.next_stage_name", is("첫 발견")));
        mvc.perform(get("/api/v1/users/me/statistics").header("X-Device-Key", key))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.completed_exploration_count", is(0)))
                .andExpect(jsonPath("$.data.completed_quest_count", is(0)))
                .andExpect(jsonPath("$.data.visited_region_count", is(0)))
                .andExpect(jsonPath("$.data.retention_stages[0].achieved", is(false)));
        mvc.perform(get("/api/v1/home").header("X-Device-Key", "미등록"))
                .andExpect(status().isNotFound()).andExpect(jsonPath("$.code", is("USER-001")));
        mvc.perform(get("/api/v1/home")).andExpect(status().isBadRequest());
    }

    @ParameterizedTest
    @NullSource
    @ValueSource(strings = "https://images.example.com/regions/sample.webp")
    void 홈은_지역대표이미지를_반환하고_통계와_인기지역_집계를_유지한다(String imageUrl) throws Exception {
        Fixture f = fixture();
        f.region().updateImageUrl(imageUrl);
        entityManager.flush();
        Quest quest = quests.save(new Quest("발견", "설명", QuestType.COMMON, ScheduleType.MEAL));
        history.save(new UserQuestHistory(f.user(), quest, f.room(), LocalDateTime.now()));
        DeviceUser other = users.save(DeviceUser.create(UUID.randomUUID().toString(), "친구"));
        records.save(new ExplorationRecord(f.room(), other, 2, 0));
        mvc.perform(get("/api/v1/users/me/statistics").header("X-Device-Key", f.key()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.completed_exploration_count", is(1)))
                .andExpect(jsonPath("$.data.completed_quest_count", is(1)))
                .andExpect(jsonPath("$.data.visited_region_count", is(1)))
                .andExpect(jsonPath("$.data.retention_stages[0].achieved", is(true)));
        mvc.perform(get("/api/v1/home").header("X-Device-Key", f.key()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.recent_records", hasSize(1)))
                .andExpect(jsonPath("$.data.recent_records[0].thumbnail_url").hasJsonPath())
                .andExpect(jsonPath("$.data.recent_records[0].thumbnail_url", imageUrl == null ? nullValue() : is(imageUrl)))
                .andExpect(jsonPath("$.data.popular_regions[?(@.region_id == " + f.region().getId()
                        + ")].region_image_url", contains(imageUrl == null ? nullValue() : is(imageUrl))))
                .andExpect(jsonPath("$.data.popular_regions[?(@.region_id == " + f.region().getId()
                        + ")].exploration_count", contains(1)))
                .andExpect(jsonPath("$.data.retention.current_stage_name", is("첫 발견")));
    }

    @Test
    void 같은날_재탐험은_재방문단계를_달성하지_않고_다른날에는_한번만_달성한다() {
        Fixture f = fixture();
        ExplorationRoom second = rooms.save(ExplorationRoom.create(f.user(), f.region(), UUID.randomUUID().toString().substring(0, 12)));
        second.finishExploration();
        ExplorationRecord repeat = records.save(new ExplorationRecord(second, f.user(), 1, 0));
        assertThat(retention.synchronize(f.key()).get(1).achieved()).isFalse();
        ReflectionTestUtils.setField(f.record(), "createdAt", LocalDateTime.now().minusDays(1));
        entityManager.flush();
        assertThat(retention.synchronize(f.key()).get(1).achieved()).isTrue();
        retention.synchronize(f.key());
        assertThat(achievements.findByUser(f.user())).hasSize(2);
        assertThat(repeat.getRegion().getId()).isEqualTo(f.region().getId());
    }

    @Test
    void 홈은_본인완료수와_현재참여자수를_표시하고_만료방은_제외한다() throws Exception {
        Fixture f = fixture();
        ExplorationRoom active = rooms.save(ExplorationRoom.create(f.user(), f.region(), UUID.randomUUID().toString().substring(0, 12)));
        RoomParticipant host = participants.save(RoomParticipant.host(active, f.user(), "탐험가"));
        Quest quest = quests.save(new Quest("발견", "설명", QuestType.COMMON, ScheduleType.MEAL));
        var candidate = candidates.save(new RoomQuestCandidate(active, quest, 1, "후보", 0));
        var finalQuest = finalQuests.save(new FinalQuest(active, candidate, 1, 1, null, null));
        QuestProgress done = progress.save(new QuestProgress(finalQuest, host));
        done.changeCompletion(true);
        active.startExploration();
        mvc.perform(get("/api/v1/home").header("X-Device-Key", f.key())).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.active_room.room_id", is(active.getId().intValue())))
                .andExpect(jsonPath("$.data.active_room.completed_quest_count", is(1)))
                .andExpect(jsonPath("$.data.active_room.participant_count", is(1)));
        ReflectionTestUtils.setField(active, "expiredAt", LocalDateTime.now().minusSeconds(1));
        mvc.perform(get("/api/v1/home").header("X-Device-Key", f.key())).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.active_room", nullValue()));
    }

    @Test
    void 사진업로드부터_이미지생성_다운로드까지_개인기록으로_연결한다() throws Exception {
        Fixture f = fixture();
        RecordPhoto photo = upload(f);
        assertThat(f.record().isStorySelected()).isTrue();
        assertThat(photo.getExpiredAt()).isEqualTo(photo.getCreatedAt().plusDays(30));
        mvc.perform(get(f.path()).header("X-Device-Key", f.key())).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.photos", hasSize(1)));
        StoryImage image = generate(f, photo);
        assertThat(image.getExpiredAt()).isEqualTo(image.getCreatedAt().plusDays(30));
        byte[] bytes = mvc.perform(get(image.getStoryImageUrl()).header("X-Device-Key", f.key()))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsByteArray();
        BufferedImage result = ImageIO.read(new ByteArrayInputStream(bytes));
        assertThat(result.getWidth()).isEqualTo(1080);
        assertThat(result.getHeight()).isEqualTo(1920);
        mvc.perform(get(f.path() + "/story-image/" + image.getId()).header("X-Device-Key", f.key()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.story_image_id", is(image.getId().intValue())));
        Files.createDirectories(Path.of("build/experience-preview"));
        Files.write(Path.of("build/experience-preview/스토리카드.png"), bytes);
    }

    @Test
    void 타인은_사진과_스토리와_업로드에_접근할_수_없다() throws Exception {
        Fixture f = fixture();
        Fixture other = fixture();
        RecordPhoto photo = upload(f);
        StoryImage image = generate(f, photo);
        mvc.perform(get(photo.getPhotoUrl()).header("X-Device-Key", other.key()))
                .andExpect(status().isNotFound()).andExpect(jsonPath("$.code", is("RECORD-001")));
        mvc.perform(get(image.getStoryImageUrl()).header("X-Device-Key", other.key())).andExpect(status().isNotFound());
        mvc.perform(multipart(f.path() + "/photos").file(photo()).header("X-Device-Key", other.key()))
                .andExpect(status().isNotFound());
        mvc.perform(get(photo.getPhotoUrl())).andExpect(status().isBadRequest());
    }

    @Test
    void 다른기록사진과_중복사진과_지원하지않는비율을_거부한다() throws Exception {
        Fixture f = fixture();
        Fixture other = fixture();
        RecordPhoto photo = upload(f);
        RecordPhoto otherPhoto = upload(other);
        mvc.perform(post(f.path() + "/story-image").header("X-Device-Key", f.key())
                .contentType(MediaType.APPLICATION_JSON).content(body(otherPhoto.getId())))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.code", is("FILE-001")));
        String duplicate = body(photo.getId()).replace("[" + photo.getId() + "]", "[" + photo.getId() + "," + photo.getId() + "]");
        mvc.perform(post(f.path() + "/story-image").header("X-Device-Key", f.key())
                .contentType(MediaType.APPLICATION_JSON).content(duplicate)).andExpect(status().isBadRequest());
        String ratio = body(photo.getId()).replace("\"memo\"", "\"image_ratio\":\"1:1\",\"memo\"");
        mvc.perform(post(f.path() + "/story-image").header("X-Device-Key", f.key())
                .contentType(MediaType.APPLICATION_JSON).content(ratio)).andExpect(status().isBadRequest());
    }

    @Test
    void 스토리를_선택하지않은_기록에서는_생성을_거부한다() throws Exception {
        Fixture f = fixture();
        mvc.perform(post(f.path() + "/story-image").header("X-Device-Key", f.key())
                .contentType(MediaType.APPLICATION_JSON).content(body(1L)))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.code", is("STORY-001")));
    }

    @ParameterizedTest
    @ValueSource(strings = {"", "가짜 PNG 파일", "<svg xmlns='http://www.w3.org/2000/svg'></svg>"})
    void 확장자와_컨텐츠타입이_이미지여도_실제이미지가_아니면_거부한다(String content) throws Exception {
        Fixture f = fixture();
        mvc.perform(multipart(f.path() + "/photos")
                .file(new MockMultipartFile("photos", "사진.png", "image/png", content.getBytes()))
                .header("X-Device-Key", f.key())).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code", is("FILE-001")));
        assertThat(f.record().isStorySelected()).isFalse();
    }

    @Test
    void 여러번_업로드해도_기록당_사진은_최대네장이다() throws Exception {
        Fixture f = fixture();
        for (int index = 0; index < 4; index++) {
            upload(f);
        }
        mvc.perform(multipart(f.path() + "/photos").file(photo()).header("X-Device-Key", f.key()))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.code", is("FILE-001")));
    }

    @Test
    void 만료된_사진과_이미지는_배치전에도_조회와_재사용을_거부하고_배치가_파일을_삭제한다() throws Exception {
        Fixture f = fixture();
        RecordPhoto photo = upload(f);
        StoryImage image = generate(f, photo);
        Path photoPath = Path.of("build/experience-images", photo.getStoredPath());
        Path imagePath = Path.of("build/experience-images", image.getStoredPath());
        assertThat(Files.exists(photoPath)).isTrue();
        ReflectionTestUtils.setField(photo, "expiredAt", LocalDateTime.now().minusSeconds(1));
        ReflectionTestUtils.setField(image, "expiredAt", LocalDateTime.now().minusSeconds(1));
        mvc.perform(get(photo.getPhotoUrl()).header("X-Device-Key", f.key())).andExpect(status().isGone());
        mvc.perform(get(image.getStoryImageUrl()).header("X-Device-Key", f.key())).andExpect(status().isGone());
        mvc.perform(post(f.path() + "/story-image").header("X-Device-Key", f.key())
                .contentType(MediaType.APPLICATION_JSON).content(body(photo.getId()))).andExpect(status().isGone());
        mvc.perform(get(f.path()).header("X-Device-Key", f.key())).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.photos", hasSize(0)));
        cleanup.cleanup();
        assertThat(photo.isDeleted()).isTrue();
        assertThat(image.isDeleted()).isTrue();
        assertThat(Files.exists(photoPath)).isFalse();
        assertThat(Files.exists(imagePath)).isFalse();
        cleanup.cleanup();
    }

    @Test
    void 템플릿목록과_실제미리보기이미지를_제공한다() throws Exception {
        mvc.perform(get("/api/v1/story-templates").header("X-Device-Key", fixture().key()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.templates", hasSize(1)));
        byte[] preview = renderer.preview();
        assertThat(ImageIO.read(new ByteArrayInputStream(preview)).getHeight()).isEqualTo(1920);
    }
    @Test
    void 지역마스터는_같은지역의_서로다른_삼일을_기준으로_달성한다() {
        Fixture f = fixture();
        ReflectionTestUtils.setField(f.record(), "createdAt", LocalDateTime.now().minusDays(2));
        for (int index = 1; index <= 2; index++) {
            ExplorationRoom room = rooms.save(ExplorationRoom.create(f.user(), f.region(),
                    UUID.randomUUID().toString().substring(0, 12)));
            room.finishExploration();
            ExplorationRecord record = records.save(new ExplorationRecord(room, f.user(), 1, 0));
            ReflectionTestUtils.setField(record, "createdAt", LocalDateTime.now().minusDays(2 - index));
        }
        entityManager.flush();
        assertThat(retention.synchronize(f.key())).allMatch(stage -> stage.achieved());
        assertThat(achievements.findByUser(f.user())).hasSize(3);
    }

    @Test
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    void 저장후_트랜잭션이_롤백되면_파일도_함께_정리한다() throws Exception {
        AtomicReference<String> path = new AtomicReference<>();
        assertThatThrownBy(() -> new TransactionTemplate(transactionManager).execute(status -> {
            path.set(storage.store(renderer.preview()));
            assertThat(Files.exists(Path.of("build/experience-images", path.get()))).isTrue();
            throw new IllegalStateException("롤백 검증");
        })).isInstanceOf(IllegalStateException.class).hasMessage("롤백 검증");
        assertThat(Files.exists(Path.of("build/experience-images", path.get()))).isFalse();
    }

    @Test
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    void 동시에_사진을_추가해도_기록당_네장_제한을_초과하지_않는다() throws Exception {
        Fixture f = new TransactionTemplate(transactionManager).execute(status -> fixture());
        assertThat(f).isNotNull();
        CountDownLatch ready = new CountDownLatch(2);
        CountDownLatch go = new CountDownLatch(1);
        try (var executor = Executors.newFixedThreadPool(2)) {
            List<Future<Integer>> responses = new ArrayList<>();
            for (int index = 0; index < 2; index++) {
                responses.add(executor.submit(() -> {
                    ready.countDown();
                    if (!go.await(10, TimeUnit.SECONDS)) {
                        throw new IllegalStateException("동시 요청 대기 시간 초과");
                    }
                    return mvc.perform(multipart(f.path() + "/photos").file(photo()).file(photo()).file(photo())
                            .header("X-Device-Key", f.key())).andReturn().getResponse().getStatus();
                }));
            }
            try {
                assertThat(ready.await(10, TimeUnit.SECONDS)).isTrue();
            } finally {
                go.countDown();
            }
            assertThat(List.of(responses.get(0).get(15, TimeUnit.SECONDS), responses.get(1).get(15, TimeUnit.SECONDS)))
                    .containsExactlyInAnyOrder(200, 400);
            new TransactionTemplate(transactionManager).executeWithoutResult(status -> {
                List<RecordPhoto> stored = photos.findByRecordAndDeletedFalseAndExpiredAtAfterOrderByPhotoOrderAsc(
                        f.record(), LocalDateTime.now());
                assertThat(stored).hasSize(3);
                stored.forEach(photo -> ReflectionTestUtils.setField(photo, "expiredAt", LocalDateTime.now().minusSeconds(1)));
                cleanup.cleanup();
            });
        }
    }

    @Test
    void 큰사진은_비율을_유지한채_최대이천사십팔픽셀로_저장한다() throws Exception {
        BufferedImage large = new BufferedImage(4096, 1024, BufferedImage.TYPE_INT_RGB);
        ByteArrayOutputStream bytes = new ByteArrayOutputStream();
        ImageIO.write(large, "png", bytes);
        byte[] normalized = renderer.normalize(new MockMultipartFile("photos", "큰사진.png", "image/png", bytes.toByteArray()));
        BufferedImage result = ImageIO.read(new ByteArrayInputStream(normalized));
        assertThat(result.getWidth()).isEqualTo(2048);
        assertThat(result.getHeight()).isEqualTo(512);
    }

    @Test
    void 확정전_홈에서도_예정퀘스트_세개를_표시한다() throws Exception {
        String key = UUID.randomUUID().toString();
        DeviceUser user = users.save(DeviceUser.create(key, "대기자"));
        Region region = regions.save(new Region(null, "대기지역", "DISTRICT", 99));
        ExplorationRoom room = rooms.save(ExplorationRoom.create(user, region, key.substring(0, 12)));
        participants.save(RoomParticipant.host(room, user, "대기자"));
        mvc.perform(get("/api/v1/home").header("X-Device-Key", key)).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.active_room.total_quest_count", is(3)))
                .andExpect(jsonPath("$.data.active_room.completed_quest_count", is(0)));
    }

    @Test
    void 사진파일_필드가_없으면_파일오류로_응답한다() throws Exception {
        Fixture f = fixture();
        mvc.perform(multipart(f.path() + "/photos").header("X-Device-Key", f.key()))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.code", is("FILE-001")));
    }

}
