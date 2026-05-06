import React, { useState, useCallback } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/lib/theme";

const VARIANTS = {
  success: { icon: "checkmark-circle" },
  error:   { icon: "close-circle" },
  warning: { icon: "warning" },
  confirm: { icon: "help-circle-outline" },
  info:    { icon: "information-circle" },
};

function iconBg(isDark) {
  return isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)";
}

export function AlertModal({
  visible,
  title,
  message,
  buttons = [],
  type = "info",
  onDismiss,
}) {
  const v = VARIANTS[type] ?? VARIANTS.info;
  const { colors } = useTheme();
  const styles = React.useMemo(() => makeStyles(colors), [colors]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        <View style={styles.box}>
          <View style={[styles.iconWrap, { backgroundColor: iconBg(colors.isDark) }]}>
            <Ionicons name={v.icon} size={34} color={colors.text} />
          </View>

          <Text style={styles.title}>{title}</Text>

          {!!message && <Text style={styles.message}>{message}</Text>}

          <View style={styles.btnRow}>
            {buttons.map((btn, idx) => {
              const isDestructive = btn.style === "destructive";
              const isCancel = btn.style === "cancel";
              return (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.btn,
                    isDestructive
                      ? styles.btnDestructive
                      : isCancel
                        ? styles.btnCancel
                        : styles.btnPrimary,
                  ]}
                  onPress={() => {
                    onDismiss();
                    btn.onPress?.();
                  }}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.btnText,
                      isDestructive
                        ? styles.btnTextDestructive
                        : isCancel
                          ? styles.btnTextCancel
                          : styles.btnTextPrimary,
                    ]}
                  >
                    {btn.text}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}

export function useAlert() {
  const [state, setState] = useState({
    visible: false,
    title: "",
    message: "",
    buttons: [],
    type: "info",
  });

  const showAlert = useCallback((title, message, buttons, type = "info") => {
    setState({
      visible: true,
      title: title ?? "",
      message: message ?? "",
      buttons: buttons?.length ? buttons : [{ text: "OK" }],
      type,
    });
  }, []);

  const dismiss = useCallback(() => {
    setState((s) => ({ ...s, visible: false }));
  }, []);

  const AlertComponent = (
    <AlertModal
      visible={state.visible}
      title={state.title}
      message={state.message}
      buttons={state.buttons}
      type={state.type}
      onDismiss={dismiss}
    />
  );

  return { showAlert, AlertComponent };
}

const BOX_WIDTH = Dimensions.get("window").width - 64;

function makeStyles(c) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.65)",
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 32,
    },
    box: {
      backgroundColor: c.surface,
      borderRadius: 24,
      paddingHorizontal: 24,
      paddingTop: 28,
      paddingBottom: 20,
      width: BOX_WIDTH,
      alignItems: "center",
    },
    iconWrap: {
      width: 68,
      height: 68,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 18,
    },
    title: {
      fontSize: 17,
      fontWeight: "800",
      color: c.text,
      textAlign: "center",
      lineHeight: 22,
      marginBottom: 8,
    },
    message: {
      fontSize: 14,
      color: c.textMuted,
      textAlign: "center",
      lineHeight: 20,
      marginBottom: 4,
    },
    btnRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
      marginTop: 24,
      width: BOX_WIDTH - 48,
    },
    btn: {
      flex: 1,
      minWidth: (BOX_WIDTH - 48 - 10) / 2,
      minHeight: 50,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 14,
      paddingHorizontal: 10,
    },
    btnPrimary: { backgroundColor: c.text },
    btnCancel: { backgroundColor: "rgba(129,128,126,0.15)" },
    btnDestructive: {
      backgroundColor: "rgba(129,128,126,0.1)",
      borderWidth: 1.5,
      borderColor: c.border2,
    },

    btnText: { fontSize: 15, fontWeight: "700", textAlign: "center" },
    btnTextPrimary: { color: c.bg },
    btnTextCancel: { color: c.textMuted },
    btnTextDestructive: { color: c.text },
  });
}
