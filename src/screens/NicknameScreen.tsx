// src/screens/NicknameScreen.tsx

import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS } from "../constants/colors";
import { setNickname } from "../api/nicknameApi";
import { scale, verticalScale, moderateScale } from "../utils/responsive";
import { router } from "expo-router";
import {
  filterNickname,
  isValidNickname,
  NICKNAME_MAX_LENGTH,
} from "../utils/nickname";
import { saveStoredNickname } from "../utils/userStorage";

export default function NicknameScreen() {
  const [nickname, setNicknameInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const currentLength = nickname.trim().length;
  const isButtonActive = isValidNickname(nickname);
  const counterColor =
    currentLength === NICKNAME_MAX_LENGTH ? COLORS.primary : COLORS.textMuted;

  const handleTextChange = (text: string) => {
    const filteredText = filterNickname(text);
    if (filteredText !== null) {
      setNicknameInput(filteredText);
    }
  };

  const handleStart = async () => {
    if (!isButtonActive || isLoading) return;

    setIsLoading(true);
    const finalNickname = nickname.trim();

    try {
      const response = await setNickname({ nickname: finalNickname });
      if (response.success) {
        // 기기 기본 닉네임 저장 → 다음 실행부터는 스플래시 후 바로 홈
        await saveStoredNickname(finalNickname);
        router.replace("/home");
      }
    } catch (error) {
      console.error("닉네임 설정 실패:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.mobileWrapper}>
        <View style={styles.inner}>
          {/* 상단 심볼 및 워드마크 */}
          <View style={styles.logoContainer}>
            <Image
              source={require("../../assets/images/Logo.png")}
              style={styles.logoImage}
              resizeMode="contain"
            />
            <View style={styles.wordmarkContainer}>
              <Text style={styles.wordmarkBlack}>먹으러</Text>
              <Text style={styles.wordmarkCoral}>GO</Text>
            </View>
          </View>

          {/* 하단 입력 폼 영역 */}
          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="닉네임을 입력해주세요"
                placeholderTextColor={COLORS.textMuted}
                value={nickname}
                onChangeText={handleTextChange}
                maxLength={10}
                autoCorrect={false}
                autoCapitalize="none"
                returnKeyType="done"
                onSubmitEditing={handleStart}
              />
              <Text style={[styles.counter, { color: counterColor }]}>
                {currentLength}/10
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.button,
                isButtonActive ? styles.buttonActive : styles.buttonInactive,
              ]}
              disabled={!isButtonActive || isLoading}
              onPress={handleStart}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.buttonText,
                  isButtonActive
                    ? styles.buttonTextActive
                    : styles.buttonTextInactive,
                ]}
              >
                시작하기
              </Text>
            </TouchableOpacity>

            <Text style={styles.infoText}>
              닉네임은 언제든지 변경할 수 있어요!
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  mobileWrapper: {
    flex: 1,
    width: "100%",
    maxWidth: 393,
    alignSelf: "center",
  },
  inner: {
    flex: 1,
    justifyContent: "center", // 로고~안내문을 한 덩어리로 화면 중앙 배치
    alignItems: "center",
    paddingHorizontal: scale(20), // 좌우 여백 20px 비율 반영
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: verticalScale(24), // 워드마크 ~ 입력창 간격
  },
  logoImage: {
    width: scale(150), // 심볼 150px 비율 반영
    height: scale(150),
    marginBottom: verticalScale(16),
  },
  wordmarkContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  wordmarkBlack: {
    fontSize: moderateScale(30), // 워드마크 30px 완충 반영
    fontWeight: "bold",
    color: COLORS.textMain,
  },
  wordmarkCoral: {
    fontSize: moderateScale(30),
    fontWeight: "bold",
    color: COLORS.primary,
  },
  inputContainer: {
    width: "100%",
    alignItems: "center",
  },
  inputWrapper: {
    width: "100%",
    height: verticalScale(52), // 인풋 높이 52px 비율 반영
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: scale(12),
    paddingHorizontal: scale(16),
    marginBottom: verticalScale(16),
    backgroundColor: COLORS.background,
  },
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
  button: {
    width: "100%",
    height: verticalScale(52), // 버튼 높이 52px 비율 반영
    justifyContent: "center",
    alignItems: "center",
    borderRadius: scale(14),
    marginBottom: verticalScale(16),
  },
  buttonActive: {
    backgroundColor: COLORS.primary,
  },
  buttonInactive: {
    backgroundColor: "#F2F2F2",
  },
  buttonText: {
    fontSize: moderateScale(16),
    fontWeight: "bold",
  },
  buttonTextActive: {
    color: COLORS.background,
  },
  buttonTextInactive: {
    color: "#A5A5A5",
  },
  infoText: {
    fontSize: moderateScale(13),
    color: COLORS.textSub,
  },
});
