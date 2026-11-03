// src/screens/WaitingRoomScreen.tsx

import React, { useCallback, useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SymbolView } from "expo-symbols";
import { router, useLocalSearchParams } from "expo-router";
import { COLORS } from "../constants/colors";
import { scale, verticalScale, moderateScale } from "../utils/responsive";
import { LogoHeader, NavHeader } from "../components/ScreenHeader";
import ProfileAvatar from "../components/ProfileAvatar";
import InviteLinkSection, {
  shareInviteLink,
} from "../components/InviteLinkSection";
import { useToast } from "../components/Toast";
import { usePolling } from "../hooks/usePolling";
import SplashScreen from "./SplashScreen";
import {
  fetchRoomDetail,
  fetchWaitingStatus,
  MAX_PARTICIPANT_COUNT,
  RoomDetail,
  startVote,
  takeOverHost,
  WaitingParticipant,
  WaitingStatus,
} from "../api/roomApi";
import { ApiError } from "../api/apiError";
import { formatConditionSummary } from "../constants/conditionLabels";

const POLLING_INTERVAL = 5000; // 5초 간격 폴링

/**
 * 07. 참여 대기(방장) / 08. 참여 대기(참가자) / 07-1. 방장 권한 이어받기
 * - 진입 시 1회 조회 + 5초 폴링, 백그라운드에서는 중단
 * - 방장 포함 2명 이상이어야 퀘스트 선택 시작 가능
 * - 방장이 5분 이상 응답이 없으면 참가자에게 이어받기 안내
 * - 방장이 탐험을 취소하면 안내 후 홈으로 이동
 */
export default function WaitingRoomScreen() {
  const { roomId } = useLocalSearchParams<{ roomId: string }>();
  const [status, setStatus] = useState<WaitingStatus | null>(null);
  const [roomDetail, setRoomDetail] = useState<RoomDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isClosed, setIsClosed] = useState(false);
  const { showToast, toast } = useToast();

  // 탐험 요약(지역명·선택 조건)은 바뀌지 않으므로 1회만 조회
  useEffect(() => {
    let ignore = false;
    fetchRoomDetail(Number(roomId))
      .then((res) => {
        if (!ignore) setRoomDetail(res.data);
      })
      .catch(() => {
        // 요약 카드만 숨김, 대기 화면은 계속 사용
      });
    return () => {
      ignore = true;
    };
  }, [roomId]);

  const closeRoom = useCallback(() => {
    setIsClosed(true);
    showToast("방장이 탐험을 취소했어요");
    setTimeout(() => router.replace("/home"), 2000);
  }, [showToast]);

  const refresh = useCallback(() => {
    fetchWaitingStatus(Number(roomId))
      .then((res) => {
        if (res.data.room_status === "EXPIRED") {
          closeRoom();
          return;
        }
        setStatus(res.data);
      })
      .catch((error) => {
        // 방이 사라짐 = 방장이 탐험 취소
        if (error instanceof ApiError && error.code === "ROOM-001") {
          closeRoom();
        } else {
          showToast("참여 상태를 불러오지 못했어요");
        }
      });
  }, [roomId, showToast, closeRoom]);

  usePolling(refresh, POLLING_INTERVAL, !isClosed);

  // 참가자: 탐험 상태가 "투표 중"으로 바뀌면 퀘스트 투표 화면으로 자동 전환
  const isVoteStarted = status?.room_status === "VOTING";
  const isHost = status?.is_host;
  useEffect(() => {
    if (isVoteStarted && !isHost) {
      // TODO: 퀘스트 투표 화면이 생기면 router.replace로 이동
      showToast("퀘스트 투표가 시작됐어요");
    }
  }, [isVoteStarted, isHost, showToast]);

  const handleStartVote = async () => {
    if (!status?.can_start_vote || isLoading) return;
    setIsLoading(true);
    try {
      await startVote(status.room_id);
      // TODO: 07번 퀘스트 투표 화면 연결
      showToast("퀘스트 투표 화면은 다음 작업에서 연결돼요");
      refresh();
    } catch {
      showToast("퀘스트 선택을 시작하지 못했어요. 다시 시도해주세요");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTakeOver = async () => {
    if (!status?.can_take_over_host || isLoading) return;
    setIsLoading(true);
    try {
      await takeOverHost(status.room_id);
      showToast("방장 권한을 이어받았어요");
      refresh();
    } catch {
      // 다른 참여자가 먼저 이어받은 경우 등
      showToast("방장 권한을 이어받지 못했어요");
      refresh();
    } finally {
      setIsLoading(false);
    }
  };

  // 첫 조회 중에는 스플래시
  if (!status) return <SplashScreen />;

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.mobileWrapper}>
        {status.can_take_over_host ? (
          <TakeOverView
            participants={status.participants}
            isLoading={isLoading}
            onTakeOver={handleTakeOver}
          />
        ) : !status.is_host ? (
          <ParticipantWaitingView
            participants={status.participants}
            roomDetail={roomDetail}
          />
        ) : (
          <WaitingView
            status={status}
            isLoading={isLoading}
            showToast={showToast}
            onStartVote={handleStartVote}
          />
        )}
      </View>
      {toast}
    </SafeAreaView>
  );
}

/**
 * 07. 참여 대기 기본 화면 (방장/참가자 공통)
 */
function WaitingView({
  status,
  isLoading,
  showToast,
  onStartVote,
}: {
  status: WaitingStatus;
  isLoading: boolean;
  showToast: (msg: string) => void;
  onStartVote: () => void;
}) {
  const canInvite = status.participants.length < MAX_PARTICIPANT_COUNT;
  const isVoteStarted = status.room_status !== "WAITING";

  return (
    <>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <LogoHeader title="참여 대기" />

        <View style={styles.intro}>
          <Text style={styles.introTitle}>친구들이 모이고 있어요</Text>
          <Text style={styles.introSub}>
            링크를 공유하면 앱 없이도 바로 참여할 수 있어요
          </Text>
        </View>

        {/* 참여자 목록 */}
        <Text style={styles.sectionTitle}>
          참여자 {status.participants.length}명
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.avatarRow}
        >
          {status.participants.map((p) => (
            <View key={p.participant_id} style={styles.avatarItem}>
              <ProfileAvatar nickname={p.nickname} size={scale(70)} />
              <Text style={styles.avatarName} numberOfLines={1}>
                {p.nickname}
              </Text>
              <Text
                style={[
                  styles.avatarRole,
                  p.role === "HOST" && styles.avatarRoleHost,
                ]}
              >
                {p.role === "HOST" ? "방장" : "참여"}
              </Text>
            </View>
          ))}
          {canInvite && (
            <TouchableOpacity
              style={styles.avatarItem}
              activeOpacity={0.7}
              onPress={() => shareInviteLink(status.invite_url)}
            >
              <View style={styles.inviteCircle}>
                <SymbolView
                  name={{ ios: "plus", android: "add", web: "add" }}
                  size={moderateScale(26)}
                  tintColor={COLORS.textMuted}
                />
              </View>
              <Text style={styles.inviteText}>초대하기</Text>
            </TouchableOpacity>
          )}
        </ScrollView>

        <View style={styles.inviteSection}>
          <InviteLinkSection
            inviteUrl={status.invite_url}
            showToast={showToast}
          />
        </View>

        {/* 퀘스트 선택 방식 안내 */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>선택 방식</Text>
          <Text style={styles.infoBody}>
            조건에 맞는 퀘스트 6개가 표시됩니다.{"\n"}각자 최대 3개까지 투표할
            수 있어요.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.bottomArea}>
        <TouchableOpacity
          style={[
            styles.ctaButton,
            (!status.can_start_vote || isLoading) && styles.ctaButtonDisabled,
          ]}
          disabled={!status.can_start_vote || isLoading}
          activeOpacity={0.8}
          onPress={onStartVote}
        >
          <Text
            style={[
              styles.ctaText,
              (!status.can_start_vote || isLoading) && styles.ctaTextDisabled,
            ]}
          >
            퀘스트 선택 시작
          </Text>
        </TouchableOpacity>
        {!status.can_start_vote && !isVoteStarted && (
          <Text style={styles.footerText}>
            방장 포함 2명 이상 모이면 시작할 수 있어요
          </Text>
        )}
      </View>
    </>
  );
}

/**
 * 08. 참여 대기 (참가자 화면)
 * - 참가자는 탐험을 시작할 권한이 없음, 방장이 시작하면 자동 전환
 */
function ParticipantWaitingView({
  participants,
  roomDetail,
}: {
  participants: WaitingParticipant[];
  roomDetail: RoomDetail | null;
}) {
  return (
    <>
      <NavHeader
        title="참여 대기"
        onBack={() => (router.canGoBack() ? router.back() : router.replace("/home"))}
      />
      <ScrollView
        contentContainerStyle={styles.participantContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.intro}>
          <Text style={styles.introTitle}>곧 시작해요</Text>
          <Text style={styles.introSub}>
            방장이 퀘스트 선택을 시작하면 자동으로 넘어가요
          </Text>
        </View>

        {/* 탐험 요약 (지역명 / 선택 조건) */}
        {roomDetail && (
          <View style={styles.summaryCard}>
            <View style={styles.summaryIcon}>
              <SymbolView
                name={{ ios: "mappin.circle.fill", android: "location_on", web: "location_on" }}
                size={moderateScale(22)}
                tintColor={COLORS.primary}
              />
            </View>
            <View style={styles.summaryTextArea}>
              <Text style={styles.summaryTitle}>
                {roomDetail.region_name} 탐험
              </Text>
              <Text style={styles.summarySub} numberOfLines={1}>
                {formatConditionSummary(roomDetail.condition)}
              </Text>
            </View>
          </View>
        )}

        <Text style={styles.sectionTitle}>참여자 {participants.length}명</Text>
        <View style={styles.participantGrid}>
          {participants.map((p) => (
            <View key={p.participant_id} style={styles.participantItem}>
              <ProfileAvatar nickname={p.nickname} size={scale(56)} />
              <Text style={styles.avatarName} numberOfLines={1}>
                {p.nickname}
              </Text>
              <Text
                style={[
                  styles.avatarRole,
                  p.role === "HOST" && styles.avatarRoleHost,
                ]}
              >
                {p.role === "HOST" ? "방장" : "참여"}
              </Text>
            </View>
          ))}
        </View>

        {/* 방장 대기 안내 */}
        <View style={styles.hostWaitArea}>
          <Text style={styles.hostWaitText}>방장이 곧 시작할 거예요!</Text>
        </View>
      </ScrollView>
    </>
  );
}

/**
 * 07-1. 방장 권한 이어받기 (참가자 화면)
 */
function TakeOverView({
  participants,
  isLoading,
  onTakeOver,
}: {
  participants: WaitingParticipant[];
  isLoading: boolean;
  onTakeOver: () => void;
}) {
  return (
    <>
      <NavHeader
        title="참여 대기"
        onBack={() => (router.canGoBack() ? router.back() : router.replace("/home"))}
      />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.noticeArea}>
          <View style={styles.iconCircle}>
            <SymbolView
              name={{ ios: "clock", android: "schedule", web: "schedule" }}
              size={moderateScale(32)}
              tintColor={COLORS.primary}
            />
          </View>
          <Text style={styles.noticeTitle}>방장이 접속하지 않고 있어요</Text>
          <Text style={styles.noticeBody}>
            5분 넘게 응답이 없어요{"\n"}다른 참여자가 방장 권한을 이어받을 수
            있어요
          </Text>
        </View>

        <Text style={[styles.sectionTitle, styles.listTitle]}>
          참여자 {participants.length}명
        </Text>
        <View style={styles.listArea}>
          {participants.map((p) => {
            const isHost = p.role === "HOST";
            const statusText = isHost
              ? `방장 · ${p.connected ? "접속 중" : "미접속"}`
              : p.connected
                ? "접속 중"
                : "미접속";
            return (
              <View key={p.participant_id} style={styles.listRow}>
                <ProfileAvatar nickname={p.nickname} size={scale(36)} />
                <Text style={styles.listName}>{p.nickname}</Text>
                <Text
                  style={[
                    styles.listStatus,
                    isHost && !p.connected && styles.listStatusAlert,
                  ]}
                >
                  {statusText}
                </Text>
              </View>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.bottomArea}>
        <TouchableOpacity
          style={[styles.ctaButton, isLoading && styles.ctaButtonDisabled]}
          disabled={isLoading}
          activeOpacity={0.8}
          onPress={onTakeOver}
        >
          <Text style={[styles.ctaText, isLoading && styles.ctaTextDisabled]}>
            방장 권한 이어받기
          </Text>
        </TouchableOpacity>
        <Text style={styles.footerText}>
          권한을 이어받으면 탐험을 시작할 수 있어요
        </Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  mobileWrapper: {
    flex: 1,
    width: "100%",
    maxWidth: 393,
    alignSelf: "center",
  },
  scrollContent: { paddingBottom: verticalScale(24) },

  intro: {
    paddingHorizontal: scale(20),
    marginTop: verticalScale(12),
    marginBottom: verticalScale(36),
  },
  introTitle: {
    fontSize: moderateScale(22),
    fontWeight: "bold",
    color: COLORS.textMain,
    marginBottom: verticalScale(6),
  },
  introSub: { fontSize: moderateScale(13), color: COLORS.textSub },

  sectionTitle: {
    fontSize: moderateScale(17),
    fontWeight: "bold",
    color: COLORS.textMain,
    paddingHorizontal: scale(20),
    marginBottom: verticalScale(10),
  },
  avatarRow: {
    paddingHorizontal: scale(20),
    gap: scale(12),
  },
  avatarItem: { width: scale(72), alignItems: "center" },
  avatarName: {
    fontSize: moderateScale(15),
    color: COLORS.textMain,
    marginTop: verticalScale(8),
  },
  avatarRole: {
    fontSize: moderateScale(13),
    color: COLORS.textMuted,
    marginTop: verticalScale(2),
  },
  avatarRoleHost: { color: COLORS.primary },
  inviteCircle: {
    width: scale(64),
    height: scale(64),
    borderRadius: scale(32),
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: COLORS.emptyCircleBorder,
    backgroundColor: COLORS.cardBg,
    justifyContent: "center",
    alignItems: "center",
    marginTop: scale(3),
  },
  inviteText: {
    fontSize: moderateScale(13),
    color: COLORS.textMuted,
    marginTop: verticalScale(10),
  },

  inviteSection: {
    paddingHorizontal: scale(20),
    marginTop: verticalScale(28),
  },

  infoCard: {
    marginHorizontal: scale(20),
    marginTop: verticalScale(28),
    padding: scale(24),
    borderRadius: scale(20),
    backgroundColor: COLORS.cardBg,
  },
  infoTitle: {
    fontSize: moderateScale(16),
    fontWeight: "bold",
    color: COLORS.textMain,
    marginBottom: verticalScale(10),
  },
  infoBody: {
    fontSize: moderateScale(14),
    lineHeight: moderateScale(20),
    color: COLORS.textSub,
  },

  participantContent: { flexGrow: 1, paddingBottom: verticalScale(24) },
  summaryCard: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: scale(20),
    marginBottom: verticalScale(36),
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(20),
    borderRadius: scale(20),
    backgroundColor: COLORS.cardBg,
    gap: scale(14),
  },
  summaryIcon: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(18),
    backgroundColor: COLORS.coralTint,
    justifyContent: "center",
    alignItems: "center",
  },
  summaryTextArea: { flex: 1 },
  summaryTitle: {
    fontSize: moderateScale(16),
    fontWeight: "bold",
    color: COLORS.textMain,
    marginBottom: verticalScale(4),
  },
  summarySub: { fontSize: moderateScale(13), color: COLORS.textSub },
  participantGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: scale(20),
    rowGap: verticalScale(16),
  },
  participantItem: { width: "33.333%", alignItems: "center" },
  hostWaitArea: {
    flex: 1,
    minHeight: verticalScale(160),
    justifyContent: "center",
    alignItems: "center",
  },
  hostWaitText: {
    fontSize: moderateScale(17),
    fontWeight: "bold",
    color: COLORS.textMain,
  },

  noticeArea: {
    alignItems: "center",
    marginTop: verticalScale(56),
    marginBottom: verticalScale(80),
  },
  iconCircle: {
    width: scale(72),
    height: scale(72),
    borderRadius: scale(36),
    backgroundColor: COLORS.coralTint,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: verticalScale(24),
  },
  noticeTitle: {
    fontSize: moderateScale(20),
    fontWeight: "bold",
    color: COLORS.textMain,
    marginBottom: verticalScale(10),
  },
  noticeBody: {
    fontSize: moderateScale(13),
    lineHeight: moderateScale(18),
    color: COLORS.textSub,
    textAlign: "center",
  },
  listTitle: { marginBottom: verticalScale(14) },
  listArea: { paddingHorizontal: scale(20) },
  listRow: {
    flexDirection: "row",
    alignItems: "center",
    height: verticalScale(60),
    borderTopWidth: 1,
    borderColor: COLORS.divider,
    gap: scale(12),
  },
  listName: {
    flex: 1,
    fontSize: moderateScale(16),
    color: COLORS.textMain,
  },
  listStatus: { fontSize: moderateScale(13), color: COLORS.textMuted },
  listStatusAlert: { color: COLORS.primary },

  bottomArea: {
    paddingHorizontal: scale(20),
    paddingTop: verticalScale(8),
    paddingBottom: verticalScale(12),
  },
  ctaButton: {
    height: verticalScale(52),
    borderRadius: scale(14),
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  ctaButtonDisabled: { backgroundColor: COLORS.disabledBg },
  ctaText: {
    fontSize: moderateScale(16),
    fontWeight: "bold",
    color: COLORS.background,
  },
  ctaTextDisabled: { color: COLORS.disabledText },
  footerText: {
    textAlign: "center",
    fontSize: moderateScale(12),
    color: COLORS.textMuted,
    marginTop: verticalScale(12),
  },
});
