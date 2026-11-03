// src/components/Toast.tsx

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, Text } from "react-native";
import { COLORS } from "../constants/colors";
import { scale, verticalScale, moderateScale } from "../utils/responsive";

const TOAST_DURATION = 2000; // 토스트 노출 2초

/**
 * 화면 하단 토스트
 * 사용: const { showToast, toast } = useToast(); ... {toast}
 */
export function useToast() {
  const [message, setMessage] = useState<string | null>(null);
  const [opacity] = useState(() => new Animated.Value(0));
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback(
    (text: string) => {
      if (timer.current) clearTimeout(timer.current);
      setMessage(text);
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
    <Animated.View pointerEvents="none" style={[styles.toast, { opacity }]}>
      <Text style={styles.toastText}>{message}</Text>
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
  toastText: {
    color: COLORS.background,
    fontSize: moderateScale(14),
  },
});
