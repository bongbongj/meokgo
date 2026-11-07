package com.meokgo.server.domain.story.service;

import com.meokgo.server.api.record.dto.RecordPhotoResponse;
import com.meokgo.server.api.story.dto.PhotoUploadResponse;
import com.meokgo.server.api.story.dto.StoryImageRequest;
import com.meokgo.server.api.story.dto.StoryImageResponse;
import com.meokgo.server.api.story.dto.StoryTemplateListResponse.TemplateResponse;
import com.meokgo.server.api.story.dto.StoryTemplateListResponse;
import com.meokgo.server.domain.record.domain.ExplorationRecord;
import com.meokgo.server.domain.record.repository.ExplorationRecordRepository;
import com.meokgo.server.domain.record.service.RecordService;
import com.meokgo.server.domain.story.domain.RecordPhoto;
import com.meokgo.server.domain.story.domain.StoryImage;
import com.meokgo.server.domain.story.domain.StoryTemplate;
import com.meokgo.server.domain.story.repository.RecordPhotoRepository;
import com.meokgo.server.domain.story.repository.StoryImageRepository;
import com.meokgo.server.domain.story.repository.StoryTemplateRepository;
import com.meokgo.server.domain.user.domain.DeviceUser;
import com.meokgo.server.domain.user.repository.DeviceUserRepository;
import com.meokgo.server.global.error.BusinessException;
import com.meokgo.server.global.error.ErrorCode;
import java.awt.image.BufferedImage;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

/**
 * 기록 소유권과 사진 유효기간을 검증하고 기록 잠금으로 업로드·이미지 생성을 직렬화한다.
 *
 * @author 정효림
 */
@Service
@Transactional(readOnly = true)
public class StoryService {
    private final DeviceUserRepository userRepository;
    private final ExplorationRecordRepository recordRepository;
    private final RecordPhotoRepository photoRepository;
    private final StoryImageRepository imageRepository;
    private final StoryTemplateRepository templateRepository;
    private final RecordService recordService;
    private final ImageStorage storage;
    private final StoryImageRenderer renderer;

    public StoryService(DeviceUserRepository userRepository, ExplorationRecordRepository recordRepository,
            RecordPhotoRepository photoRepository, StoryImageRepository imageRepository,
            StoryTemplateRepository templateRepository, RecordService recordService,
            ImageStorage storage, StoryImageRenderer renderer) {
        this.userRepository = userRepository;
        this.recordRepository = recordRepository;
        this.photoRepository = photoRepository;
        this.imageRepository = imageRepository;
        this.templateRepository = templateRepository;
        this.recordService = recordService;
        this.storage = storage;
        this.renderer = renderer;
    }

    public StoryTemplateListResponse templates(String deviceKey) {
        user(deviceKey);
        return new StoryTemplateListResponse(templateRepository.findByActiveTrueOrderByDisplayOrderAscIdAsc().stream()
                .map(template -> new TemplateResponse(template.getId(), template.getName(), template.getPreviewUrl()))
                .toList());
    }

    public byte[] preview(String deviceKey, Long templateId) {
        user(deviceKey);
        template(templateId);
        return renderer.preview();
    }

    @Transactional
    public PhotoUploadResponse upload(String deviceKey, Long recordId, List<MultipartFile> files) {
        ExplorationRecord record = owned(deviceKey, recordId, true);
        LocalDateTime now = LocalDateTime.now();
        List<RecordPhoto> existing = photoRepository
                .findByRecordAndDeletedFalseAndExpiredAtAfterOrderByPhotoOrderAsc(record, now);
        if (files == null || files.isEmpty() || files.size() + existing.size() > 4) {
            throw new BusinessException(ErrorCode.FILE_INVALID);
        }
        List<byte[]> normalized = files.stream().map(renderer::normalize).toList();
        int order = photoRepository.maxPhotoOrder(record);
        List<RecordPhotoResponse> photos = new ArrayList<>();
        for (byte[] bytes : normalized) {
            RecordPhoto photo = photoRepository.save(new RecordPhoto(record, storage.store(bytes), ++order));
            photo.assignUrl();
            photos.add(new RecordPhotoResponse(photo.getId(), photo.getPhotoUrl()));
        }
        record.selectStory();
        return new PhotoUploadResponse(recordId, photos);
    }

    @Transactional
    public StoryImageResponse generate(String deviceKey, Long recordId, StoryImageRequest request) {
        ExplorationRecord record = owned(deviceKey, recordId, true);
        if (!record.isStorySelected()) {
            throw new BusinessException(ErrorCode.STORY_NOT_SELECTED);
        }
        if (new HashSet<>(request.photoIds()).size() != request.photoIds().size()) {
            throw new BusinessException(ErrorCode.FILE_INVALID);
        }
        StoryTemplate template = template(request.templateId());
        List<BufferedImage> photos = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();
        for (Long photoId : request.photoIds()) {
            RecordPhoto photo = photoRepository.findByIdAndRecord(photoId, record)
                    .orElseThrow(() -> new BusinessException(ErrorCode.FILE_INVALID));
            if (!photo.available(now)) {
                throw new BusinessException(ErrorCode.FILE_NOT_FOUND);
            }
            photos.add(renderer.decode(storage.read(photo.getStoredPath())));
        }
        var detail = recordService.detail(deviceKey, recordId);
        byte[] bytes = renderer.render(photos, record.getRegion().getName(),
                record.getCreatedAt().format(DateTimeFormatter.ofPattern("yyyy.MM.dd")),
                detail.completedQuests().stream().map(quest -> quest.questTitle()).toList(), request.memo());
        StoryImage image = imageRepository.save(new StoryImage(record, template, storage.store(bytes)));
        image.assignUrl();
        record.changeMemo(request.memo());
        return StoryImageResponse.from(image);
    }

    public StoryImageResponse image(String deviceKey, Long recordId, Long imageId) {
        return StoryImageResponse.from(availableImage(owned(deviceKey, recordId, false), imageId));
    }

    public byte[] imageContent(String deviceKey, Long recordId, Long imageId) {
        return storage.read(availableImage(owned(deviceKey, recordId, false), imageId).getStoredPath());
    }

    public byte[] photoContent(String deviceKey, Long recordId, Long photoId) {
        ExplorationRecord record = owned(deviceKey, recordId, false);
        RecordPhoto photo = photoRepository.findByIdAndRecord(photoId, record)
                .orElseThrow(() -> new BusinessException(ErrorCode.FILE_NOT_FOUND));
        if (!photo.available(LocalDateTime.now())) {
            throw new BusinessException(ErrorCode.FILE_NOT_FOUND);
        }
        return storage.read(photo.getStoredPath());
    }

    private StoryImage availableImage(ExplorationRecord record, Long id) {
        StoryImage image = imageRepository.findByIdAndRecord(id, record)
                .orElseThrow(() -> new BusinessException(ErrorCode.STORY_IMAGE_NOT_FOUND));
        if (!image.available(LocalDateTime.now())) {
            throw new BusinessException(ErrorCode.FILE_NOT_FOUND);
        }
        return image;
    }

    private StoryTemplate template(Long templateId) {
        return templateRepository.findByIdAndActiveTrue(templateId)
                .orElseThrow(() -> new BusinessException(ErrorCode.COMMON_INVALID_REQUEST, "사용 가능한 템플릿이 아닙니다."));
    }

    private ExplorationRecord owned(String deviceKey, Long recordId, boolean lock) {
        DeviceUser user = user(deviceKey);
        return (lock ? recordRepository.findOwnedForUpdate(recordId, user) : recordRepository.findByIdAndUser(recordId, user))
                .orElseThrow(() -> new BusinessException(ErrorCode.RECORD_NOT_FOUND));
    }

    private DeviceUser user(String deviceKey) {
        return userRepository.findByDeviceKey(deviceKey)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
    }
}
