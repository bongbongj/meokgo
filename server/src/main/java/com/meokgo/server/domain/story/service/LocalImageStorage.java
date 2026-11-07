package com.meokgo.server.domain.story.service;

import com.meokgo.server.global.error.BusinessException;
import com.meokgo.server.global.error.ErrorCode;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

/**
 * 파일명을 서버에서 발급하고 트랜잭션 롤백 시 생성 파일을 정리한다.
 *
 * @author 정효림
 */
@Component
public class LocalImageStorage implements ImageStorage {
    private static final Logger log = LoggerFactory.getLogger(LocalImageStorage.class);
    private final Path root;

    public LocalImageStorage(@Value("${app.storage.local-root:./storage}") String root) {
        this.root = Path.of(root).toAbsolutePath().normalize();
    }

    @Override
    public String store(byte[] content) {
        String name = UUID.randomUUID() + ".png";
        try {
            Files.createDirectories(root);
            Files.write(resolve(name), content);
            if (TransactionSynchronizationManager.isSynchronizationActive()) {
                TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                    @Override
                    public void afterCompletion(int status) {
                        if (status != STATUS_COMMITTED) {
                            try {
                                delete(name);
                            } catch (RuntimeException exception) {
                                log.error("롤백된 이미지 파일 정리에 실패했습니다: {}", name, exception);
                            }
                        }
                    }
                });
            }
            return name;
        } catch (IOException exception) {
            try {
                Files.deleteIfExists(resolve(name));
            } catch (IOException cleanupException) {
                exception.addSuppressed(cleanupException);
            }
            log.error("이미지 파일 저장에 실패했습니다.", exception);
            throw new BusinessException(ErrorCode.FILE_STORAGE_FAILED);
        }
    }

    @Override
    public byte[] read(String path) {
        try {
            Path file = resolve(path);
            if (!Files.isRegularFile(file)) {
                throw new BusinessException(ErrorCode.FILE_NOT_FOUND);
            }
            return Files.readAllBytes(file);
        } catch (IOException exception) {
            log.error("이미지 파일 읽기에 실패했습니다.", exception);
            throw new BusinessException(ErrorCode.FILE_STORAGE_FAILED);
        }
    }

    @Override
    public void delete(String path) {
        try {
            Files.deleteIfExists(resolve(path));
        } catch (IOException exception) {
            log.error("만료된 이미지 파일 삭제에 실패했습니다.", exception);
            throw new BusinessException(ErrorCode.FILE_STORAGE_FAILED);
        }
    }

    private Path resolve(String path) {
        if (!path.matches("[0-9a-f-]{36}\\.png")) {
            throw new BusinessException(ErrorCode.FILE_INVALID);
        }
        return root.resolve(path);
    }
}
