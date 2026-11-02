// src/components/common/ConfirmDialog.tsx
// 확인창 (배경 딤 + 가운데 모달, 취소 / 확인 버튼)
// - 취소 버튼 또는 딤 영역을 누르면 onCancel
// - children으로 본문 아래 추가 정보를 넣을 수 있다 (예: 현재 득표 1위)

import React from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { COLORS } from "../../constants/colors";
import { moderateScale, scale, verticalScale } from "../../utils/responsive";

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message?: string;
  children?: React.ReactNode;
  cancelLabel?: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
  loading?: boolean;
}

export default function ConfirmDialog({
  visible,
  title,
  message,
  children,
  cancelLabel = "취소",
  confirmLabel,
  onCancel,
  onConfirm,
  loading = false,
}: ConfirmDialogProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <Pressable
        style={styles.dim}
        onPress={loading ? undefined : onCancel}
        accessibilityLabel="닫기"
      >
        {/* 카드 안쪽을 눌러도 닫히지 않도록 이벤트를 막는다 */}
        <Pressable style={styles.card} onPress={() => {}}>
          <Text style={styles.title}>{title}</Text>
          {message && <Text style={styles.message}>{message}</Text>}
          {children}

          <View style={styles.buttons}>
            <TouchableOpacity
              style={[styles.button, styles.cancel]}
              onPress={onCancel}
              disabled={loading}
              activeOpacity={0.8}
              accessibilityRole="button"
            >
              <Text style={styles.cancelText}>{cancelLabel}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.confirm]}
              onPress={onConfirm}
              disabled={loading}
              activeOpacity={0.8}
              accessibilityRole="button"
            >
              {loading ? (
                <ActivityIndicator color={COLORS.background} />
              ) : (
                <Text style={styles.confirmText}>{confirmLabel}</Text>
              )}
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  dim: {
    flex: 1,
    backgroundColor: COLORS.dim,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: scale(40),
  },
  // 디자인: 313 x 272, radius 20
  card: {
    width: "100%",
    maxWidth: 313,
    backgroundColor: COLORS.background,
    borderRadius: scale(20),
    paddingHorizontal: scale(24),
    paddingTop: verticalScale(32),
    paddingBottom: verticalScale(16),
  },
  title: {
    fontSize: moderateScale(18),
    fontWeight: "bold",
    color: COLORS.textMain,
    textAlign: "center",
  },
  message: {
    marginTop: verticalScale(8),
    fontSize: moderateScale(13),
    lineHeight: moderateScale(16),
    color: COLORS.textSub,
    textAlign: "center",
  },
  buttons: {
    flexDirection: "row",
    gap: scale(10),
    marginTop: verticalScale(20),
  },
  button: {
    flex: 1,
    height: verticalScale(46),
    borderRadius: scale(12),
    justifyContent: "center",
    alignItems: "center",
  },
  cancel: { backgroundColor: COLORS.cardBg },
  confirm: { backgroundColor: COLORS.primary },
  cancelText: {
    fontSize: moderateScale(15),
    fontWeight: "bold",
    color: COLORS.textSub,
  },
  confirmText: {
    fontSize: moderateScale(15),
    fontWeight: "bold",
    color: COLORS.background,
  },
});
