// src/components/records/NicknameSheet.tsx
// 12. 닉네임 변경 바텀시트
// - 기존 닉네임이 입력된 상태로 열림, 입력 필드 오른쪽 안쪽에 n/10 (10자면 코랄)
// - 한글·영문·숫자만, 10자 초과 입력 무시 (01 닉네임 설정과 같은 규칙: utils/nickname.ts)
// - 시트 밖 탭 / 뒤로가기 시 변경 없이 닫힘, 저장 시 onSave (성공하면 부모가 닫음)

import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { COLORS } from "../../constants/colors";
import { moderateScale, scale, verticalScale } from "../../utils/responsive";
import { filterNickname, isValidNickname, NICKNAME_MAX_LENGTH } from "../../utils/nickname";
import PrimaryButton from "../common/PrimaryButton";

interface NicknameSheetProps {
  visible: boolean;
  initialNickname: string;
  saving: boolean;
  onClose: () => void;
  onSave: (nickname: string) => void;
}

export default function NicknameSheet({
  visible,
  initialNickname,
  saving,
  onClose,
  onSave,
}: NicknameSheetProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      {/* 열 때마다 기존 닉네임으로 다시 채우도록 visible일 때만 내용을 만든다 */}
      {visible && (
        <SheetBody
          initialNickname={initialNickname}
          saving={saving}
          onClose={onClose}
          onSave={onSave}
        />
      )}
    </Modal>
  );
}

function SheetBody({
  initialNickname,
  saving,
  onClose,
  onSave,
}: Omit<NicknameSheetProps, "visible">) {
  const [nickname, setNickname] = useState(initialNickname);

  const handleChange = (text: string) => {
    const filtered = filterNickname(text);
    if (filtered !== null) setNickname(filtered);
  };

  const length = nickname.trim().length;
  const canSave = isValidNickname(nickname) && nickname.trim() !== initialNickname;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="닫기" />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <Text style={styles.title}>닉네임 변경</Text>
        <View style={styles.inputBox}>
          <TextInput
            style={styles.input}
            value={nickname}
            onChangeText={handleChange}
            placeholder="닉네임을 입력해주세요"
            placeholderTextColor={COLORS.textMuted}
            autoFocus
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="done"
            onSubmitEditing={() => canSave && !saving && onSave(nickname.trim())}
          />
          <Text
            style={[
              styles.counter,
              length >= NICKNAME_MAX_LENGTH && styles.counterFull,
            ]}
          >
            {length}/{NICKNAME_MAX_LENGTH}
          </Text>
        </View>
        <PrimaryButton
          label="저장"
          onPress={() => onSave(nickname.trim())}
          disabled={!canSave}
          loading={saving}
          style={styles.button}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.3)" },
  sheet: {
    maxWidth: 393,
    width: "100%",
    alignSelf: "center",
    backgroundColor: COLORS.background,
    borderTopLeftRadius: scale(28),
    borderTopRightRadius: scale(28),
    paddingHorizontal: scale(26),
    paddingTop: verticalScale(8),
    paddingBottom: verticalScale(44),
  },
  handle: {
    alignSelf: "center",
    width: scale(32),
    height: verticalScale(4),
    borderRadius: 2,
    backgroundColor: COLORS.border,
    marginBottom: verticalScale(70),
  },
  title: {
    fontSize: moderateScale(20),
    fontWeight: "bold",
    color: COLORS.textMain,
    marginBottom: verticalScale(14),
  },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    height: verticalScale(40),
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: scale(12),
    paddingHorizontal: scale(18),
  },
  input: {
    flex: 1,
    height: "100%",
    fontSize: moderateScale(15),
    color: COLORS.textMain,
  },
  counter: { fontSize: moderateScale(12), color: COLORS.textMuted },
  counterFull: { color: COLORS.primary },
  button: { marginTop: verticalScale(46) },
});
