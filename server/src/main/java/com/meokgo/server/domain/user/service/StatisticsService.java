package com.meokgo.server.domain.user.service;

import com.meokgo.server.api.statistics.dto.StatisticsResponse;
import com.meokgo.server.domain.quest.repository.UserQuestHistoryRepository;
import com.meokgo.server.domain.record.repository.ExplorationRecordRepository;
import com.meokgo.server.domain.retention.service.RetentionService;
import com.meokgo.server.domain.user.domain.DeviceUser;
import com.meokgo.server.domain.user.repository.DeviceUserRepository;
import com.meokgo.server.global.error.BusinessException;
import com.meokgo.server.global.error.ErrorCode;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class StatisticsService {
    private final DeviceUserRepository userRepository;
    private final ExplorationRecordRepository recordRepository;
    private final UserQuestHistoryRepository historyRepository;
    private final RetentionService retentionService;

    public StatisticsService(DeviceUserRepository userRepository, ExplorationRecordRepository recordRepository,
            UserQuestHistoryRepository historyRepository, RetentionService retentionService) {
        this.userRepository = userRepository;
        this.recordRepository = recordRepository;
        this.historyRepository = historyRepository;
        this.retentionService = retentionService;
    }

    @Transactional
    public StatisticsResponse statistics(String deviceKey) {
        var stages = retentionService.synchronize(deviceKey);
        DeviceUser user = userRepository.findByDeviceKey(deviceKey)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        return new StatisticsResponse(recordRepository.countByUser(user), historyRepository.countByUser(user),
                recordRepository.countVisitedRegions(user), stages);
    }
}
