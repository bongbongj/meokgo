package com.meokgo.server.domain.retention.service;

import com.meokgo.server.api.statistics.dto.StatisticsResponse.StageResponse;
import com.meokgo.server.domain.record.domain.ExplorationRecord;
import com.meokgo.server.domain.record.repository.ExplorationRecordRepository;
import com.meokgo.server.domain.retention.domain.RetentionStage;
import com.meokgo.server.domain.retention.domain.UserRetentionStage;
import com.meokgo.server.domain.retention.repository.RetentionStageRepository;
import com.meokgo.server.domain.retention.repository.UserRetentionStageRepository;
import com.meokgo.server.domain.user.domain.DeviceUser;
import com.meokgo.server.domain.user.repository.DeviceUserRepository;
import com.meokgo.server.global.error.BusinessException;
import com.meokgo.server.global.error.ErrorCode;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 사용자 잠금으로 단계 달성 이력의 중복 생성을 방지하고 기존 탐험 기록도 반영한다.
 *
 * @author 정효림
 */
@Service
public class RetentionService {
    private final int masterVisitDays;
    private final DeviceUserRepository userRepository;
    private final ExplorationRecordRepository recordRepository;
    private final RetentionStageRepository stageRepository;
    private final UserRetentionStageRepository achievementRepository;

    public RetentionService(DeviceUserRepository userRepository, ExplorationRecordRepository recordRepository,
            RetentionStageRepository stageRepository, UserRetentionStageRepository achievementRepository,
            @Value("${app.retention.region-master-visit-days:3}") int masterVisitDays) {
        if (masterVisitDays < 3) {
            throw new IllegalArgumentException("지역 마스터 달성 기준은 3일 이상이어야 합니다.");
        }
        this.masterVisitDays = masterVisitDays;
        this.userRepository = userRepository;
        this.recordRepository = recordRepository;
        this.stageRepository = stageRepository;
        this.achievementRepository = achievementRepository;
    }

    @Transactional
    public List<StageResponse> synchronize(String deviceKey) {
        DeviceUser user = userRepository.findByDeviceKeyForUpdate(deviceKey)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        List<RetentionStage> stages = stageRepository.findByActiveTrueOrderByDisplayOrderAscIdAsc();
        Set<Long> achieved = achievementRepository.findByUser(user).stream()
                .map(value -> value.getStage().getId()).collect(Collectors.toSet());
        List<ExplorationRecord> records = recordRepository.findByUserOrderByCreatedAtAscIdAsc(user);
        for (RetentionStage stage : stages) {
            if (achieved.contains(stage.getId())) {
                continue;
            }
            ExplorationRecord evidence = switch (stage.getCode()) {
                case "FIRST_DISCOVERY" -> records.isEmpty() ? null : records.getFirst();
                case "ALLEY_EXPLORER" -> revisit(records, 2);
                case "REGION_MASTER" -> revisit(records, masterVisitDays);
                default -> null;
            };
            if (evidence != null) {
                achievementRepository.save(new UserRetentionStage(user, stage,
                        !stage.getCode().equals("FIRST_DISCOVERY") ? evidence.getRegion() : null, evidence.getCreatedAt()));
                achieved.add(stage.getId());
            }
        }
        return stages.stream().map(stage -> new StageResponse(stage.getCode(), stage.getName(),
                achieved.contains(stage.getId()), stage.getRewardDescription())).toList();
    }

    @Transactional(readOnly = true)
    public Summary summary(List<StageResponse> stages) {
        String current = null;
        RetentionStage next = null;
        Map<String, RetentionStage> definitions = stageRepository.findByActiveTrueOrderByDisplayOrderAscIdAsc()
                .stream().collect(Collectors.toMap(RetentionStage::getCode, stage -> stage));
        for (StageResponse stage : stages) {
            if (stage.achieved()) {
                current = stage.stageName();
            } else if (next == null) {
                next = definitions.get(stage.stageCode());
            }
        }
        return new Summary(current, next == null ? null : next.getName(),
                next == null ? null : next.getAchievementCondition());
    }

    private ExplorationRecord revisit(List<ExplorationRecord> records, int requiredDays) {
        Map<Long, Set<LocalDate>> visits = new HashMap<>();
        for (ExplorationRecord record : records) {
            Set<LocalDate> dates = visits.computeIfAbsent(record.getRegion().getId(), key -> new HashSet<>());
            dates.add(record.getCreatedAt().toLocalDate());
            if (dates.size() >= requiredDays) {
                return record;
            }
        }
        return null;
    }

    public record Summary(String currentStageName, String nextStageName, String nextCondition) {
    }
}
