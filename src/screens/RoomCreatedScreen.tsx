// src/screens/RoomCreatedScreen.tsx

import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { COLORS } from "../constants/colors";
import { scale, verticalScale, moderateScale } from "../utils/responsive";
import InviteLinkSection from "../components/InviteLinkSection";
import { useToast } from "../components/Toast";

/**
 * 05. 초대장 (탐험방 생성 완료)
 * - 링크 복사(토스트), 카카오톡 공유, 참여 대기방으로 이동
 */
export default function RoomCreatedScreen() {
  const { roomId, inviteUrl } = useLocalSearchParams<{
    roomId: string;
    inviteUrl: string;
  }>();
  const { showToast, toast } = useToast();

  const goWaitingRoom = () => {
    router.replace({ pathname: "/waiting/[roomId]", params: { roomId } });
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.mobileWrapper}>
        <View style={styles.hero}>
          <Text style={styles.title}>탐험방이 만들어졌어요</Text>
          <Image
            source={require("../../assets/images/illustration_map.png")}
            style={styles.illustration}
            resizeMode="contain"
          />
        </View>

        <View style={styles.bottomArea}>
          <InviteLinkSection inviteUrl={inviteUrl} showToast={showToast} />
          {/* 와이어프레임에 없는 버튼: 참여 대기방 이동 수단 */}
          <TouchableOpacity
            style={styles.textButton}
            activeOpacity={0.7}
            onPress={goWaitingRoom}
          >
            <Text style={styles.textButtonText}>참여 대기방으로 이동</Text>
          </TouchableOpacity>
        </View>
      </View>
      {toast}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  mobileWrapper: {
    flex: 1,
    width: "100%",
    maxWidth: 393,
    alignSelf: "center",
    paddingHorizontal: scale(20),
  },
  hero: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: moderateScale(21),
    fontWeight: "bold",
    color: COLORS.textMain,
    marginBottom: verticalScale(32),
  },
  illustration: { width: scale(130), height: scale(130) },
  bottomArea: { paddingBottom: verticalScale(40) },
  textButton: {
    alignSelf: "center",
    paddingVertical: verticalScale(14),
    paddingHorizontal: scale(16),
    marginTop: verticalScale(4),
  },
  textButtonText: {
    fontSize: moderateScale(14),
    color: COLORS.textSub,
    textDecorationLine: "underline",
  },
});
