package com.meokgo.server.domain.story.service;

public interface ImageStorage {
    String store(byte[] content);
    byte[] read(String path);
    void delete(String path);
}
