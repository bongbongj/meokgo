package com.meokgo.server.global.init;

import com.meokgo.server.domain.retention.domain.RetentionStage;
import com.meokgo.server.domain.retention.repository.RetentionStageRepository;
import com.meokgo.server.domain.story.domain.StoryTemplate;
import com.meokgo.server.domain.story.repository.StoryTemplateRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class ExperienceDataLoader implements ApplicationRunner {
    private final int masterVisitDays;
    private final RetentionStageRepository repository;
    private final StoryTemplateRepository templates;

    public ExperienceDataLoader(RetentionStageRepository repository, StoryTemplateRepository templates,
            @Value("${app.retention.region-master-visit-days:3}") int masterVisitDays) {
        this.masterVisitDays = masterVisitDays;
        this.templates = templates;
        this.repository = repository;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (templates.count() == 0) {
            StoryTemplate template = templates.save(new StoryTemplate("기본 템플릿", 1));
            template.assignPreviewUrl();
        }
        if (!repository.existsByCode("FIRST_DISCOVERY")) {
            repository.save(new RetentionStage("FIRST_DISCOVERY", "첫 발견", "첫 탐험을 종료해 보세요.", "첫 탐험 카드", 1));
        }
        String masterCondition = "같은 지역의 탐험을 서로 다른 " + masterVisitDays + "일에 종료해 보세요.";
        RetentionStage master = repository.findByCode("REGION_MASTER").orElseGet(() -> repository.save(
                new RetentionStage("REGION_MASTER", "지역 마스터", masterCondition, "지역 마스터 배지", 3)));
        master.changeAchievementCondition(masterCondition);
        if (!repository.existsByCode("ALLEY_EXPLORER")) {
            repository.save(new RetentionStage("ALLEY_EXPLORER", "골목 탐험가",
                    "다른 날 같은 지역의 탐험을 다시 종료해 보세요.", "재방문 탐험 배지", 2));
        }
    }
}
