package com.meokgo.server.domain.story.service;

import com.meokgo.server.domain.story.domain.StoredImage;
import com.meokgo.server.domain.story.repository.RecordPhotoRepository;
import com.meokgo.server.domain.story.repository.StoryImageRepository;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 유효기간이 지난 파일을 소량씩 삭제하고 실패한 파일은 다음 실행에서 재시도한다.
 *
 * @author 정효림
 */
@Service
public class ExpiredImageCleanup {
    private static final Logger log = LoggerFactory.getLogger(ExpiredImageCleanup.class);
    private final RecordPhotoRepository photoRepository;
    private final StoryImageRepository imageRepository;
    private final ImageStorage storage;

    public ExpiredImageCleanup(RecordPhotoRepository photoRepository, StoryImageRepository imageRepository,
            ImageStorage storage) {
        this.photoRepository = photoRepository;
        this.imageRepository = imageRepository;
        this.storage = storage;
    }

    @Scheduled(fixedDelayString = "${app.storage.cleanup-delay-ms:3600000}",
            initialDelayString = "${app.storage.cleanup-initial-delay-ms:60000}")
    @Transactional
    public void cleanup() {
        LocalDateTime now = LocalDateTime.now();
        List<StoredImage> expired = new ArrayList<>();
        expired.addAll(photoRepository.findByDeletedFalseAndExpiredAtLessThanEqualOrderByIdAsc(now, PageRequest.of(0, 100)));
        expired.addAll(imageRepository.findByDeletedFalseAndExpiredAtLessThanEqualOrderByIdAsc(now, PageRequest.of(0, 100)));
        for (StoredImage image : expired) {
            try {
                storage.delete(image.getStoredPath());
                image.markDeleted();
            } catch (RuntimeException exception) {
                log.error("만료 파일 정리를 다음 실행에서 재시도합니다: {}", image.getStoredPath(), exception);
            }
        }
    }
}
