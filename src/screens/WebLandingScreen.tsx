// src/screens/WebLandingScreen.tsx

import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS } from "../constants/colors";

/**
 * 웹 첫 화면 (/)
 * - 웹은 초대받은 참여자용이라 방장용 화면(닉네임 설정·홈) 대신 초대 링크 안내만 보여 준다
 */
export default function WebLandingScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Image
          source={require("../../assets/images/Logo.png")}
          style={styles.logoImage}
          resizeMode="contain"
        />
        <View style={styles.wordmarkContainer}>
          <Text style={styles.wordmarkBlack}>먹으러</Text>
          <Text style={styles.wordmarkCoral}>GO</Text>
        </View>

        <Text style={styles.title}>초대 링크로 접속해 주세요</Text>
        <Text style={styles.body}>
          친구에게 받은 초대 링크를 열면{"\n"}앱 설치 없이 바로 탐험에 참여할 수 있어요
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: {
    flex: 1,
    width: "100%",
    maxWidth: 393,
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  logoImage: { width: 110, height: 110, marginBottom: 16 },
  wordmarkContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: 36,
    marginBottom: 32,
  },
  wordmarkBlack: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.textMain,
    letterSpacing: -0.5,
  },
  wordmarkCoral: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.primary,
    letterSpacing: -0.5,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.textMain,
    marginBottom: 8,
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.textSub,
    textAlign: "center",
  },
});
