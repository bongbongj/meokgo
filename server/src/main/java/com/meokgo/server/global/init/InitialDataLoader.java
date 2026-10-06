package com.meokgo.server.global.init;

import com.meokgo.server.domain.quest.domain.Quest;
import com.meokgo.server.domain.quest.domain.QuestType;
import com.meokgo.server.domain.quest.repository.QuestRepository;
import com.meokgo.server.domain.region.domain.Region;
import com.meokgo.server.domain.region.repository.RegionRepository;
import com.meokgo.server.domain.room.domain.ScheduleType;
import java.util.List;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class InitialDataLoader implements ApplicationRunner {

    private final RegionRepository regionRepository;
    private final QuestRepository questRepository;

    public InitialDataLoader(RegionRepository regionRepository, QuestRepository questRepository) {
        this.regionRepository = regionRepository;
        this.questRepository = questRepository;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        loadRegions();
        loadQuests();
    }

    private void loadRegions() {
        if (regionRepository.count() > 0) {
            return;
        }
        regionRepository.saveAll(List.of(
                new Region(null, "홍대", "DISTRICT", 1),
                new Region(null, "성수", "DISTRICT", 2),
                new Region(null, "망원", "DISTRICT", 3)
        ));
    }

    private void loadQuests() {
        if (questRepository.count() > 0) {
            return;
        }
        questRepository.saveAll(List.of(
                new Quest("모두 처음 가는 식당 가기", "오늘의 탐험 지역에서 모두 처음 가보는 식당을 찾아보세요.", QuestType.COMMON, ScheduleType.MEAL),
                new Quest("메인 메뉴 하나씩 다르게 고르기", "각자 다른 메인 메뉴를 골라 테이블을 풍성하게 만들어보세요.", QuestType.COMMON, ScheduleType.MEAL),
                new Quest("가게 사장님 추천 메뉴 먹기", "직원이나 사장님에게 추천 메뉴를 물어보고 주문해보세요.", QuestType.COMMON, ScheduleType.MEAL),
                new Quest("간판만 보고 들어가기", "후기 검색 없이 간판과 분위기만 보고 한 곳을 골라보세요.", QuestType.COMMON, ScheduleType.MEAL),
                new Quest("골목 안쪽 가게 찾아가기", "큰길보다 골목 안쪽에 있는 가게를 선택해보세요.", QuestType.COMMON, ScheduleType.MEAL),
                new Quest("처음 보는 메뉴 주문하기", "평소 먹지 않던 메뉴를 하나 골라보세요.", QuestType.COMMON, ScheduleType.MEAL),
                new Quest("디저트까지 이어가기", "식사 후 근처 디저트나 카페까지 탐험을 이어가보세요.", QuestType.COMMON, ScheduleType.CAFE),
                new Quest("사진 한 장 남기기", "오늘의 음식이나 골목 분위기를 사진으로 남겨보세요.", QuestType.COMMON, ScheduleType.MEAL),
                new Quest("지도 없이 5분 걷고 고르기", "정해둔 방향으로 5분 걷고 눈에 띄는 가게를 골라보세요.", QuestType.COMMON, ScheduleType.MEAL),
                new Quest("다음에 올 후보 한 곳 저장하기", "오늘 가지 못한 가게 중 다음 후보를 하나 정해보세요.", QuestType.COMMON, ScheduleType.MEAL)
        ));
    }
}
