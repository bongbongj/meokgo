package com.meokgo.server.domain.vote.service;

import com.meokgo.server.domain.room.domain.ExplorationRoom;
import com.meokgo.server.domain.room.domain.RoomParticipant;
import com.meokgo.server.domain.room.service.RoomAccessService;
import com.meokgo.server.domain.vote.domain.Vote;
import com.meokgo.server.domain.vote.repository.VoteRepository;
import com.meokgo.server.global.error.BusinessException;
import com.meokgo.server.global.error.ErrorCode;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class VoteAccessService {

    public record Context(ExplorationRoom room, RoomParticipant participant, Vote vote) {
    }

    private final RoomAccessService roomAccessService;
    private final VoteRepository voteRepository;

    public VoteAccessService(RoomAccessService roomAccessService, VoteRepository voteRepository) {
        this.roomAccessService = roomAccessService;
        this.voteRepository = voteRepository;
    }

    public Context read(String deviceKey, Long roomId) {
        RoomAccessService.Context context = roomAccessService.access(deviceKey, roomId);
        Vote vote = voteRepository.findByRoom(context.room())
                .orElseThrow(() -> new BusinessException(ErrorCode.QUEST_CANDIDATE_NOT_READY));
        return new Context(context.room(), context.participant(), vote);
    }

    public Context lock(String deviceKey, Long roomId) {
        Context context = read(deviceKey, roomId);
        roomAccessService.requireActive(context.room());
        return context;
    }

    public void requireHost(Context context) {
        roomAccessService.requireHost(context.participant());
    }

    public List<RoomParticipant> activeParticipants(ExplorationRoom room) {
        return roomAccessService.participants(room);
    }
}
