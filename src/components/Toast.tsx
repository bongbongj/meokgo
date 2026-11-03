// src/components/Toast.tsx

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { COLORS } from "../constants/colors";
import { scale, verticalScale, moderateScale } from "../utils/responsive";

const TOAST_DURATION = 2000; // 토스트 노출 2초

/**
 * 화면 하단 토스트
 * 사용: const { showToast, toast } = useToast(); ... {toast}
 * - showToast(text, { icon: "check" }): pill 모양 + 왼쪽 코랄 체크 원 (13 닉네임 변경 완료)
 */
interface ToastOptions {
  icon?: "check";
}

export function useToast() {
  const [message, setMessage] = useState<string | null>(null);
  const [options, setOptions] = useState<ToastOptions>({});
  const [opacity] = useState(() => new Animated.Value(0));
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback(
    (text: string, toastOptions: ToastOptions = {}) => {
      if (timer.current) clearTimeout(timer.current);
      setMessage(text);
      setOptions(toastOptions);
      Animated.timing(opacity, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start();
      timer.current = setTimeout(() => {
        Animated.timing(opacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }).start(() => setMessage(null));
      }, TOAST_DURATION);
    },
    [opacity],
  );

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const toast = message ? (
    <Animated.View
      pointerEvents="none"
      style={[styles.toast, options.icon && styles.toastWithIcon, { opacity }]}
    >
      {options.icon === "check" && (
        <View style={styles.checkCircle}>
          <View style={styles.checkMark} />
        </View>
      )}
      <Text style={[styles.toastText, options.icon && styles.toastTextBold]}>
        {message}
      </Text>
    </Animated.View>
  ) : null;

  return { showToast, toast };
}

const styles = StyleSheet.create({
  toast: {
    position: "absolute",
    bottom: verticalScale(140),
    alignSelf: "center",
    backgroundColor: COLORS.toastBg,
    borderRadius: scale(12),
    paddingHorizontal: scale(18),
    paddingVertical: verticalScale(12),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 8,
  },
  toastWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 999,
    paddingLeft: scale(12),
  },
  checkCircle: {
    width: scale(22),
    height: scale(22),
    borderRadius: scale(11),
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: scale(8),
  },
  checkMark: {
    width: scale(9),
    height: scale(5),
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderColor: COLORS.background,
    transform: [{ rotate: "-45deg" }],
    marginTop: -2,
  },
  toastText: {
    color: COLORS.background,
    fontSize: moderateScale(14),
  },
  toastTextBold: { fontWeight: "bold" },
});
