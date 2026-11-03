// src/components/InviteLinkSection.tsx

import React from "react";
import { Share, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import * as Clipboard from "expo-clipboard";
import { COLORS } from "../constants/colors";
import { scale, verticalScale, moderateScale } from "../utils/responsive";

// 화면에는 https:// 를 뺀 짧은 링크로 표시
const displayUrl = (url: string) => url.replace(/^https?:\/\//, "");

/**
 * 링크 복사: 성공/실패 토스트
 */
export async function copyInviteLink(
  url: string,
  showToast: (msg: string) => void,
) {
  try {
    await Clipboard.setStringAsync(url);
    showToast("초대 링크를 복사했어요");
  } catch {
    showToast("링크 복사에 실패했어요. 다시 시도해주세요");
  }
}

/**
 * 공유 시트 호출
 * TODO: 카카오톡 SDK 연동 전까지 시스템 공유 시트 사용
 */
export async function shareInviteLink(url: string) {
  try {
    await Share.share({ message: `먹으러GO 탐험에 초대합니다!\n${url}` });
  } catch {
    // 사용자가 공유를 취소한 경우 등은 무시
  }
}

/**
 * 초대 링크 + 복사 버튼 + 카카오톡 공유 버튼 (05 초대장, 07 참여 대기)
 */
export default function InviteLinkSection({
  inviteUrl,
  showToast,
}: {
  inviteUrl: string;
  showToast: (msg: string) => void;
}) {
  return (
    <View>
      <Text style={styles.label}>초대 링크</Text>
      <View style={styles.linkRow}>
        <View style={styles.linkBox}>
          <Text style={styles.linkText} numberOfLines={1}>
            {displayUrl(inviteUrl)}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.copyButton}
          activeOpacity={0.8}
          onPress={() => copyInviteLink(inviteUrl, showToast)}
        >
          <Text style={styles.copyText}>복사</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        style={styles.shareButton}
        activeOpacity={0.8}
        onPress={() => shareInviteLink(inviteUrl)}
      >
        <Text style={styles.shareText}>카카오톡으로 공유</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: moderateScale(17),
    fontWeight: "bold",
    color: COLORS.textMain,
    marginBottom: verticalScale(12),
  },
  linkRow: {
    flexDirection: "row",
    gap: scale(8),
    marginBottom: verticalScale(12),
  },
  linkBox: {
    flex: 1,
    height: verticalScale(48),
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: scale(12),
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: scale(12),
  },
  linkText: { fontSize: moderateScale(15), color: COLORS.textMain },
  copyButton: {
    width: scale(82),
    height: verticalScale(48),
    backgroundColor: COLORS.cardBg,
    borderRadius: scale(12),
    justifyContent: "center",
    alignItems: "center",
  },
  copyText: {
    fontSize: moderateScale(15),
    fontWeight: "bold",
    color: COLORS.textMain,
  },
  shareButton: {
    height: verticalScale(52),
    backgroundColor: COLORS.primary,
    borderRadius: scale(14),
    justifyContent: "center",
    alignItems: "center",
  },
  shareText: {
    fontSize: moderateScale(16),
    fontWeight: "bold",
    color: COLORS.background,
  },
});
