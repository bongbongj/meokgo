import React from "react";
import {
  StyleSheet,
  View,
  Text,
  Image,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { COLORS } from "../constants/colors";

export default function SplashScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      <View style={styles.centerContent}>
        {/* 심볼 (130 x 130) */}
        <Image
          source={require("../../assets/images/Logo.png")}
          style={styles.logoImage}
          resizeMode="contain"
        />

        {/* 서비스명 워드마크 (393 x 36 영역 / Inter Bold 24) */}
        <View style={styles.wordmarkContainer}>
          <Text style={styles.wordmarkBlack}>먹으러</Text>
          <Text style={styles.wordmarkCoral}>GO</Text>
        </View>

        {/* 한 줄 소개 (393 x 18 영역 / Regular 13) */}
        <Text style={styles.subTitle}>친구들과 함께하는 맛집 탐험</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  logoImage: {
    width: 130,
    height: 130,
    marginBottom: 20,
  },
  wordmarkContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 36,
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
  subTitle: {
    marginTop: 8,
    fontSize: 13,
    color: COLORS.textSub,
    textAlign: "center",
    height: 18,
    letterSpacing: -0.3,
  },
});
