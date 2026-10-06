package com.meokgo.server.domain.room.service;

import com.meokgo.server.api.invite.dto.InviteInfoResponse;
import com.meokgo.server.api.invite.dto.JoinInviteResponse;
import com.meokgo.server.domain.room.domain.ExplorationRoom;
import com.meokgo.server.domain.room.domain.InviteLink;
import com.meokgo.server.domain.room.domain.RoomParticipant;
import com.meokgo.server.domain.room.repository.InviteLinkRepository;
import com.meokgo.server.domain.room.repository.RoomParticipantRepository;
import com.meokgo.server.domain.user.domain.DeviceUser;
import com.meokgo.server.domain.user.repository.DeviceUserRepository;
import com.meokgo.server.global.error.BusinessException;
import com.meokgo.server.global.error.ErrorCode;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class InviteService {

    private final InviteLinkRepository inviteLinkRepository;
    private final RoomParticipantRepository participantRepository;
    private final DeviceUserRepository deviceUserRepository;

    public InviteService(
            InviteLinkRepository inviteLinkRepository,
            RoomParticipantRepository participantRepository,
            DeviceUserRepository deviceUserRepository
    ) {
        this.inviteLinkRepository = inviteLinkRepository;
        this.participantRepository = participantRepository;
        this.deviceUserRepository = deviceUserRepository;
    }

    @Transactional(readOnly = true)
    public InviteInfoResponse getInviteInfo(String token) {
        InviteLink inviteLink = findInviteLink(token);
        ExplorationRoom room = inviteLink.getRoom();
        String reason = unjoinableReason(inviteLink, room);

        return new InviteInfoResponse(
                inviteLink.getToken(),
                room.getId(),
                room.getHostUser().getNickname(),
                room.getRegion().getName(),
                inviteLink.getCreatedAt(),
                inviteLink.getExpiredAt(),
                reason == null,
                reason
        );
    }

    @Transactional
    public JoinInviteResponse join(String deviceKey, String token, String nickname) {
        InviteLink inviteLink = findInviteLink(token);
        ExplorationRoom room = inviteLink.getRoom();
        if (inviteLink.isExpired()) {
            throw new BusinessException(ErrorCode.INVITE_EXPIRED);
        }
        if (!room.isJoinable()) {
            throw new BusinessException(ErrorCode.ROOM_ALREADY_STARTED);
        }

        DeviceUser user = deviceUserRepository.findByDeviceKey(deviceKey)
                .orElseGet(() -> deviceUserRepository.save(DeviceUser.create(deviceKey, nickname)));
        return participantRepository.findByRoomAndUser(room, user)
                .map(participant -> restoreParticipant(room, participant))
                .orElseGet(() -> joinNewParticipant(room, user, nickname));
    }

    private JoinInviteResponse restoreParticipant(ExplorationRoom room, RoomParticipant participant) {
        participant.restore();
        return new JoinInviteResponse(room.getId(), participant.getId(), room.getStatus().name(), true);
    }

    private JoinInviteResponse joinNewParticipant(ExplorationRoom room, DeviceUser user, String nickname) {
        if (participantRepository.countByRoom(room) >= room.getMaxParticipantCount()) {
            throw new BusinessException(ErrorCode.PARTICIPANT_LIMIT_EXCEEDED);
        }
        if (participantRepository.existsByRoomAndNickname(room, nickname)) {
            throw new BusinessException(ErrorCode.PARTICIPANT_NICKNAME_DUPLICATED);
        }
        RoomParticipant participant = participantRepository.save(RoomParticipant.member(room, user, nickname));
        return new JoinInviteResponse(room.getId(), participant.getId(), room.getStatus().name(), false);
    }

    private InviteLink findInviteLink(String token) {
        return inviteLinkRepository.findByToken(token)
                .orElseThrow(() -> new BusinessException(ErrorCode.INVITE_INVALID));
    }

    private String unjoinableReason(InviteLink inviteLink, ExplorationRoom room) {
        if (inviteLink.isExpired()) {
            return "EXPIRED";
        }
        if (!room.isJoinable()) {
            return "ALREADY_STARTED";
        }
        if (participantRepository.countByRoom(room) >= room.getMaxParticipantCount()) {
            return "FULL";
        }
        return null;
    }
}
