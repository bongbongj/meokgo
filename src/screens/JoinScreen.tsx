// src/screens/JoinScreen.tsx

import React, { useEffect, useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SymbolView } from "expo-symbols";
import { router, useLocalSearchParams } from "expo-router";
import { COLORS } from "../constants/colors";
import { scale, verticalScale, moderateScale } from "../utils/responsive";
import {
  filterNickname,
  isValidNickname,
  NICKNAME_MAX_LENGTH,
} from "../utils/nickname";
import {
  fetchInvite,
  InviteInfo,
  joinInvite,
  UnjoinableReason,
} from "../api/inviteApi";
import { ApiError } from "../api/apiError";
import { useToast } from "../components/Toast";
import SplashScreen from "./SplashScreen";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

// 2026-09-30T10:00:00 → 2026년 9월 30일 (수)
const formatInviteDate = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 (${WEEKDAYS[date.getDay()]})`;
};

// 참여 API 오류 코드 → 06-1 참여 마감 사유
const CLOSED_REASON_BY_CODE: Record<string, UnjoinableReason> = {
  "ROOM-002": "ALREADY_STARTED",
  "PARTICIPANT-002": "FULL",
  "INVITE-001": "INVALID_LINK",
  "INVITE-002": "EXPIRED",
};

// 참여 불가 화면으로 교체 (뒤로가기로 다시 들어와도 같은 화면 유지)
const goClosed = (reason: UnjoinableReason) => {
  router.replace({ pathname: "/join-closed", params: { reason } });
};

/**
 * 06. 친구 참여 링크 접속 (+ 06-2 닉네임 중복 오류 상태)
 * - 로그인이나 앱 설치 없이 닉네임만 입력해 참여
 */
export default function JoinScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const [invite, setInvite] = useState<InviteInfo | null>(null);
  const [nickname, setNickname] = useState("");
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { showToast, toast } = useToast();

  // 초대 정보 조회, 참여할 수 없으면 06-1로 분기
  useEffect(() => {
    let ignore = false;
    fetchInvite(token)
      .then((res) => {
        if (ignore) return;
        if (!res.data.joinable) {
          goClosed(res.data.unjoinable_reason ?? "INVALID_LINK");
          return;
        }
        setInvite(res.data);
      })
      .catch(() => {
        if (!ignore) goClosed("INVALID_LINK");
      });
    return () => {
      ignore = true;
    };
  }, [token]);

  const currentLength = nickname.trim().length;
  const canSubmit = isValidNickname(nickname) && !isDuplicate && !isLoading;
  const counterColor =
    currentLength === NICKNAME_MAX_LENGTH ? COLORS.primary : COLORS.textMuted;

  const handleTextChange = (text: string) => {
    const filtered = filterNickname(text);
    if (filtered === null) return;
    setNickname(filtered);
    // 다른 닉네임을 입력하면 오류 해제
    if (filtered !== nickname) setIsDuplicate(false);
  };

  const handleJoin = async () => {
    if (!canSubmit) return;
    setIsLoading(true);
    try {
      const res = await joinInvite(token, nickname.trim());
      router.replace({
        pathname: "/waiting/[roomId]",
        params: { roomId: String(res.data.room_id) },
      });
    } catch (error) {
      const code = error instanceof ApiError ? error.code : "";
      if (code === "PARTICIPANT-003") {
        setIsDuplicate(true);
      } else if (CLOSED_REASON_BY_CODE[code]) {
        goClosed(CLOSED_REASON_BY_CODE[code]);
      } else {
        showToast("참여하지 못했어요. 다시 시도해주세요");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 초대 정보 로딩 중에는 스플래시
  if (!invite) return <SplashScreen />;

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={styles.mobileWrapper}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* 초대 안내 */}
          <View style={styles.hero}>
            <Text style={styles.title}>
              {invite.host_nickname}님과의 탐험에 초대합니다!
            </Text>
            <Image
              source={require("../../assets/images/illustration_invite.png")}
              style={styles.illustration}
              resizeMode="contain"
            />
          </View>

          {/* 초대 정보 */}
          <View style={styles.infoList}>
            <InfoRow label="초대한 사람" value={invite.host_nickname} />
            <InfoRow label="탐험 지역" value={invite.region_name} />
            <InfoRow
              label="초대한 날짜"
              value={formatInviteDate(invite.created_at)}
            />
          </View>
        </ScrollView>

        {/* 닉네임 입력 + 참여 */}
        <View style={styles.bottomArea}>
          <View
            style={[styles.inputWrapper, isDuplicate && styles.inputWrapperError]}
          >
            <TextInput
              style={styles.input}
              placeholder="닉네임을 입력해주세요"
              placeholderTextColor={COLORS.textMuted}
              value={nickname}
              onChangeText={handleTextChange}
              maxLength={NICKNAME_MAX_LENGTH}
              autoCorrect={false}
              autoCapitalize="none"
              returnKeyType="done"
              onSubmitEditing={handleJoin}
            />
            <Text style={[styles.counter, { color: counterColor }]}>
              {currentLength}/{NICKNAME_MAX_LENGTH}
            </Text>
          </View>

          {isDuplicate && (
            <View style={styles.errorRow}>
              <SymbolView
                name={{ ios: "exclamationmark.circle", android: "error", web: "error" }}
                size={moderateScale(16)}
                tintColor={COLORS.primary}
              />
              <Text style={styles.errorText}>
                이미 사용 중인 닉네임이에요. 다른 닉네임을 입력해주세요
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.ctaButton, !canSubmit && styles.ctaButtonDisabled]}
            disabled={!canSubmit}
            activeOpacity={0.8}
            onPress={handleJoin}
          >
            <Text style={[styles.ctaText, !canSubmit && styles.ctaTextDisabled]}>
              탐험 시작하기
            </Text>
          </TouchableOpacity>

          <Text style={styles.footerText}>
            {isDuplicate
              ? "같은 탐험방 안에서는 닉네임이 중복될 수 없어요"
              : "로그인이나 앱 설치 없이 참여할 수 있어요"}
          </Text>
        </View>
      </KeyboardAvoidingView>
      {toast}
    </SafeAreaView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
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
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(24),
  },

  hero: { alignItems: "center" },
  title: {
    fontSize: moderateScale(21),
    fontWeight: "bold",
    color: COLORS.textMain,
    textAlign: "center",
    marginBottom: verticalScale(32),
  },
  illustration: { width: scale(110), height: scale(110) },

  infoList: {
    marginTop: verticalScale(48),
    paddingHorizontal: scale(40),
    gap: verticalScale(10),
  },
  infoRow: { flexDirection: "row", alignItems: "center" },
  infoLabel: {
    width: scale(126),
    fontSize: moderateScale(15),
    fontWeight: "bold",
    color: COLORS.textMain,
  },
  infoValue: { fontSize: moderateScale(16), color: COLORS.textMain },

  bottomArea: {
    paddingHorizontal: scale(20),
    paddingBottom: verticalScale(24),
  },
  inputWrapper: {
    height: verticalScale(52),
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: scale(12),
    paddingHorizontal: scale(16),
    backgroundColor: COLORS.background,
  },
  inputWrapperError: { borderColor: COLORS.primary, borderWidth: 1.5 },
  input: {
    flex: 1,
    height: "100%",
    fontSize: moderateScale(15),
    color: COLORS.textMain,
    paddingVertical: 0,
    ...(Platform.OS === "web" ? ({ outlineStyle: "none" } as any) : {}),
  },
  counter: {
    fontSize: moderateScale(12),
    fontWeight: "500",
    marginLeft: scale(8),
  },
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
    marginTop: verticalScale(8),
  },
  errorText: { fontSize: moderateScale(13), color: COLORS.primary },
  ctaButton: {
    height: verticalScale(52),
    borderRadius: scale(14),
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginTop: verticalScale(14),
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
    fontSize: moderateScale(13),
    color: COLORS.textMuted,
    marginTop: verticalScale(14),
  },
});
